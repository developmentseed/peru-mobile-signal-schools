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
import mercantile
import geopandas as gpd
from shapely.geometry import box, shape
from shapely.ops import unary_union
import rasterio as rio
from rasterio.mask import mask

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
        return True
    except Exception as ex:
        print("vectorize_tif", ex)
    return False


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


def process_point(feature, folder_viewhead, observer_height, radio_mts, points):
    results = []
    ids_generated = []
    try:
        features = [i for i in points if i.get("properties").get("tile") == feature.get("properties").get("tile")]
        if not features:
            print("No features")
            return feature
        dem_input = feature.get("properties").get("dem_input")
        dataset = gdal.Open(dem_input, gdalconst.GA_ReadOnly)

        for feature_point in features:
            num = feature_point.get("properties").get("idx")
            ids_generated.append(num)
            coordinates = feature_point.get("geometry", {}).get("coordinates")
            observer_x, observer_y = coordinates
            tif_path = f"{folder_viewhead}/{num}__{observer_height}.tiff"
            geojson_path = f"{folder_viewhead}/{num}__{observer_height}.geojson"

            if Path(geojson_path).exists():
                try:
                    with open(geojson_path, 'r') as file:
                        tmp_data = json.load(file).get("features", [])
                        if tmp_data:
                            results.append(True)
                            continue
                except Exception as ex:
                    print(ex)

            band = dataset.GetRasterBand(1)

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
            results.append(vectorize_tif(tif_path, geojson_path))

    except Exception as e:
        print("process_point", e)
    feature["properties"]["id_dem"] = str(ids_generated)
    return feature


def get_tile(lng, lat, zoom_level):
    tile = mercantile.tile(lng, lat, zoom_level)
    return f"{tile.x}_{tile.y}_{tile.z}"


def tile_parent(tile_str):
    x, y, z = tile_str.split("_")
    tile = mercantile.Tile(x=int(x), y=int(y), z=int(z))
    neighbors = mercantile.neighbors(tile)
    polygons = []
    for neighbor in neighbors:
        bbox = mercantile.bounds(neighbor)
        polygon = box(bbox.west, bbox.south, bbox.east, bbox.north)
        polygons.append(polygon)
    bbox = unary_union(polygons).bounds
    return box(*bbox)


def clip_raster_tmp(feature, raster_path, folder_save):
    try:
        filename = feature.get("properties").get("tile")

        shapely_geometry = shape(feature.get("geometry"))
        geoms = [shapely_geometry.__geo_interface__]
        with rio.open(raster_path) as src:
            out_image, out_transform = mask(src, geoms, crop=True)
            out_meta = src.meta.copy()
            out_meta.update({"driver": "GTiff",
                             "height": out_image.shape[1],
                             "width": out_image.shape[2],
                             "transform": out_transform})

            with rio.open(f"{folder_save}/{filename}.tif", "w", **out_meta) as dest:
                dest.write(out_image)
        feature["properties"]["dem_input"] = f"{folder_save}/{filename}.tif"
        return feature
    except Exception as ex:
        print("clip_raster_tmp", ex)
        return feature


def run(
        dem_input, points, observer_height, folder_viewhead, output_geojson_bbox, radio_mts, zoom_group
):
    features_gpd = gpd.read_file(points)
    features_gpd.crs = "EPSG:3857"
    # reproject
    features_gpd_4326 = features_gpd.to_crs(4326)
    features_gpd_4326["tile"] = features_gpd_4326.centroid.apply(lambda x: get_tile(x.x, x.y, zoom_group))
    # save points
    features_gpd_3857 = features_gpd_4326.to_crs(3857)
    features = json.loads(features_gpd_3857.to_json()).get("features")

    features_gpd_4326_clean = features_gpd_4326.drop_duplicates(subset=["tile"])
    features_gpd_4326_clean["geometry"] = features_gpd_4326_clean["tile"].apply(tile_parent)
    features_gpd_3857_bbox = features_gpd_4326_clean.to_crs(3857)
    features_gpd_3857_bbox = features_gpd_3857_bbox[["tile", "geometry"]]
    features_3857_bbox = json.loads(features_gpd_3857_bbox.to_json()).get("features")
    features_gpd_3857_bbox.to_file("data/features_gpd_3857_bbox.geojson", driver="GeoJSON")
    # create tmp clips
    folder_viewhead_tmp_tif = f"{folder_viewhead}_tmp_tif"
    os.makedirs(folder_viewhead_tmp_tif, exist_ok=True)
    os.makedirs(folder_viewhead, exist_ok=True)

    # generate temporal tif
    features_3857_bbox_clip = Parallel(n_jobs=-1)(
        delayed(clip_raster_tmp)(
            feature, dem_input, folder_viewhead_tmp_tif
        )
        for feature in tqdm(
            features_3857_bbox, desc="Generate temporal raster"
        )
    )
    # calculate viewshed
    features_3857_bbox_new = Parallel(n_jobs=-1)(
        delayed(process_point)(feature, folder_viewhead, observer_height, radio_mts, features)
        for feature in tqdm(
            features_3857_bbox_clip, desc="Process points"
        )
    )
    df = gpd.GeoDataFrame.from_features(features_3857_bbox_new)
    df.crs = "EPSG:3857"
    df.to_crs(4326).to_file(output_geojson_bbox, driver="GeoJSON")


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
    "--output_geojson_bbox",
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
@click.option(
    "--zoom_group",
    help="zoom for clip",
    required=False,
    default=12,
    type=int,
)
def main(
        dem_input, points, observer_height, folder_viewhead, output_geojson_bbox, radio_mts, zoom_group
):
    run(
        dem_input,
        points,
        observer_height,
        folder_viewhead,
        output_geojson_bbox,
        radio_mts,
        zoom_group
    )


if __name__ == "__main__":
    main()
