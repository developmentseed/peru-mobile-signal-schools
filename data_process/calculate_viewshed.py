import click
import json
import os
from osgeo import gdal, gdalconst, ogr
from tqdm import tqdm
from joblib import Parallel, delayed
import numpy as np
from glob import glob
from itertools import chain
from pathlib import Path

gdal.AllRegister()
gdal.UseExceptions()

EPSG = {"type": "name", "properties": {"name": "urn:ogc:def:crs:EPSG::3857"}}


def vectorize_tif(input_raster, output_vector):
    try:
        src_ds = gdal.Open(input_raster)
        src_band = src_ds.GetRasterBand(1)
        if os.path.exists(output_vector):
            os.remove(output_vector)

        driver = ogr.GetDriverByName("GeoJSON")
        dst_ds = driver.CreateDataSource(output_vector)

        dst_layer = dst_ds.CreateLayer("vectorized", srs=None)
        new_field = ogr.FieldDefn("Value", ogr.OFTInteger)
        dst_layer.CreateField(new_field)

        data = src_band.ReadAsArray()
        unique_values = np.unique(data)

        for value in unique_values:
            mask = np.where(data == value, value, 0).astype(np.uint8)
            driver_mem = gdal.GetDriverByName("MEM")
            mask_ds = driver_mem.Create(
                "", src_ds.RasterXSize, src_ds.RasterYSize, 1, gdal.GDT_Byte
            )
            mask_band = mask_ds.GetRasterBand(1)
            mask_band.WriteArray(mask)

            mask_ds.SetGeoTransform(src_ds.GetGeoTransform())
            mask_ds.SetProjection(src_ds.GetProjection())

            gdal.Polygonize(
                mask_band, mask_band, dst_layer, 0, ["ATTRIBUTE=Value"], callback=None
            )

    except Exception as ex:
        print("vectorize_tif", ex)


def read_files(file_path, separate):
    try:
        features_ = json.load(open(file_path)).get("features")
        if not separate:
            file_num = file_path.split("/")[-1].split("__")[0]
            for feat in features_:
                feat["properties"]["num"] = file_num
        return features_
    except Exception as ex:
        print(ex)
        return []


def merge_vectors(s, c, glob_path, file_out, separate=False):
    try:
        features = Parallel(n_jobs=-1)(
            delayed(read_files)(file_path_, separate)
            for file_path_ in tqdm(
                list(glob(f"{glob_path}/*.geojson")), desc=f"read geojson files"
            )
        )

        features = list(chain.from_iterable(features))
        if not features:
            print(f"no features {glob_path}")

        data_cat = {}
        for feature in tqdm(features, "fix features props"):
            if not feature:
                continue
            if c:
                feature["properties"]["company"] = c
            if s:
                feature["properties"]["sygnal"] = s
            if separate:
                value = feature["properties"].get("Value")
                if not data_cat.get(value):
                    data_cat[value] = []
                data_cat[value].append(feature)

        if separate:
            for k, v in data_cat.items():
                data_out = {"type": "FeatureCollection", "crs": EPSG, "features": v}
                file_out = file_out.replace(".geojson", f"__{k}.geojson")
                json.dump(data_out, open(file_out, "w"))
                print(
                    "total features",
                    file_out,
                    len(data_out),
                )
        else:
            data_out = {"type": "FeatureCollection", "crs": EPSG, "features": features}
            json.dump(data_out, open(file_out, "w"))
            print("total features", file_out, len(features))

    except Exception as ex:
        print("merge_vectors", ex)


def process_point(feature, pathname, observer_height, dem_input, radio_mts):
    try:
        dataset = gdal.Open(dem_input, gdalconst.GA_ReadOnly)
        band = dataset.GetRasterBand(1)

        num = feature.get("id")
        coordinates = feature.get("geometry", {}).get("coordinates")
        observer_x, observer_y = coordinates
        tif_path = f"{pathname}/{num}__{observer_height}.tiff"
        geojson_path = f"{pathname}/{num}__{observer_height}.geojson"
        if Path(tif_path).exists() and Path(geojson_path).exists():
            return True

        gdal.ViewshedGenerate(
            srcBand=band,
            driverName="GTiff",
            targetRasterName=tif_path,
            creationOptions=[],
            observerX=observer_x,
            observerY=observer_y,
            observerHeight=observer_height,
            targetHeight=1.5,
            visibleVal=1,
            invisibleVal=2,
            outOfRangeVal=0,
            noDataVal=0,
            dfCurvCoeff=0.13,
            mode=1,
            maxDistance=radio_mts,
        )
        # # vectorize
        vectorize_tif(tif_path, geojson_path)
        return True
    except Exception as e:
        print("process_point", e)
    return False


def run(
        dem_input, points, observer_height, folder_viewhead, output_geojson_file, radio_mts
):
    features = json.load(open(points)).get("features")
    # filtrer by categories
    plus_1mb = [i for i in features if i.get("properties", {}).get("plus_1mb")]
    up_1mb = [i for i in features if i.get("properties", {}).get("up_1mb")]
    # create folders
    sygnal = ["plus_1mb", "up_1mb"]
    companies = ["Vi", "Te", "En", "Am"]

    folders = [f"{folder_viewhead}/{s}/{c}" for s in sygnal for c in companies]
    for fd in folders:
        os.makedirs(fd, exist_ok=True)

    ## gdal

    for folder in folders:
        s, c = folder.split("/")[-2:]
        features_tmp = [*plus_1mb]
        if s == "up_1mb":
            features_tmp = [*up_1mb]
        features_tmp_filter = [
            i
            for i in features_tmp
            if i.get("properties", {}).get("emp") == c
        ]

        features_status = Parallel(n_jobs=-1)(
            delayed(process_point)(
                feature, folder, observer_height, dem_input, radio_mts
            )
            for feature in tqdm(
                features_tmp_filter, desc=f"Evaluate {s}  for {c} - data"
            )
        )
        merge_vectors(s, c, folder, f"{folder_viewhead}/{s}__{c}.geojson")

    merge_vectors(None, None, folder_viewhead, output_geojson_file, True)


@click.command(short_help="Create viewshead ")
@click.option(
    "--dem_input",
    help="Raster dem path",
    required=True,
    type=str,
)
@click.option(
    "--points",
    help="Points geojson file",
    required=True,
    type=str,
)
@click.option(
    "--observer_height",
    help="observer_height in mts",
    required=False,
    default=30,
    type=int,
)
@click.option(
    "--folder_viewhead",
    help="output raster folder",
    required=True,
    type=str,
)
@click.option(
    "--output_geojson_file",
    help="output vectorize features",
    required=True,
    type=str,
)
@click.option(
    "--radio_mts",
    help="radio  in mts",
    required=False,
    default=10000,
    type=int,
)
def main(
        dem_input, points, observer_height, folder_viewhead, output_geojson_file, radio_mts
):
    run(
        dem_input,
        points,
        observer_height,
        folder_viewhead,
        output_geojson_file,
        radio_mts,
    )


if __name__ == "__main__":
    main()
