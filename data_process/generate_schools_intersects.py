import json
import ast
import click
import pandas as pd
import geopandas as gpd
from shapely.geometry import box, shape
from shapely.ops import unary_union
import mercantile
from itertools import chain
from pathlib import Path
from tqdm import tqdm
from joblib import Parallel, delayed
from geojson import FeatureCollection as fc
from copy import deepcopy
import gzip


def read_viewhead(feature, file_geojson_path):
    try:
        gdf = gpd.read_file(f"{file_geojson_path}/{feature.get('properties').get('idx')}.geojson")
        gdf.crs = "EPSG:4326"
        gdf["features_intersec"] = feature.get("properties").get("features_intersec", [])
        gdf["idx"] = feature.get('properties').get('idx')
        return gdf.copy()
    except Exception as ex:
        print(ex)
        return gpd.GeoDataFrame()


def run(schools_path, antennas_path, schools_out_path, file_geojson_path):
    df_schools = gpd.read_file(schools_path)
    df_schools.crs = "EPSG:4326"
    df_schools["fake_id"] = list(range(1, df_schools.shape[0] + 1))

    # process antenas
    df_anteas = gpd.read_file(antennas_path)
    df_anteas.crs = "EPSG:4326"
    df_anteas["exist"] = df_anteas["idx"].apply(lambda idx: Path(f"{file_geojson_path}/{idx}.geojson").exists())
    df_anteas = df_anteas[df_anteas["exist"]]
    df_anteas_json = json.loads(df_anteas.to_json()).get("features")
    new_antenas_list = Parallel(n_jobs=-1)(
        delayed(read_viewhead)(feature, file_geojson_path)
        for feature in tqdm(df_anteas_json, desc=f"process antenas ")
    )
    new_antenas_list = [i for i in new_antenas_list if not i.empty]
    new_antenas = pd.concat(new_antenas_list, ignore_index=True)
    invalid_geoms = new_antenas[new_antenas.geometry.is_valid == False]
    if not invalid_geoms.empty:
        invalid_geoms_ids = invalid_geoms["idx"].unique().tolist()
        new_antenas['geometry'] = new_antenas.geometry.apply(lambda x: x if x.is_valid else x.buffer(0))
        new_antenas_filter = new_antenas[new_antenas["idx"].isin(invalid_geoms_ids)]
        for idx_g, df_g in new_antenas_filter.groupby("idx"):
            df_g = df_g[["idx", "geometry"]]
            df_g.to_file(f"{file_geojson_path}/{idx_g}.geojson", driver='GeoJSON')
        print("fix some geometries")

    intersections = gpd.sjoin(df_schools, new_antenas, op='intersects', how='left')
    # intersections.to_file(schools_out_path, driver="GeoJSON")
    # merge data
    intersections_json = json.loads(intersections.to_json()).get("features")
    new_features = {}
    fields_exclude = ["fake_id", "index_right", "Value", "features_intersec", "idx"]
    for i in tqdm(intersections_json, desc="group by fake_id"):
        props = dict(i.get("properties"))
        fake_id = props.get("fake_id")
        if not new_features.get(fake_id):
            new_feature = deepcopy(i)
            new_props = {k: v for k, v in props.items() if k not in fields_exclude}
            new_props["ant_id"] = []
            new_props["ant_data"] = []
            #
            new_feature["properties"] = deepcopy(new_props)
            new_features[fake_id] = new_feature
        idx = props.get("idx")
        if idx:
            new_features[fake_id]["properties"]["ant_id"].append(idx)

        features_intersec = props.get("features_intersec", None)
        if features_intersec:
            new_features[fake_id]["properties"]["ant_data"] += json.loads(str(features_intersec))
    # save file
    values = list(new_features.values())
    json.dump(fc(values), open(schools_out_path, "w"))
    # save gzip
    json_str = json.dumps(fc(values))
    json_bytes = json_str.encode('utf-8')
    with gzip.GzipFile(schools_out_path.replace(".geojson", ".geojson.gz"), 'w') as f_out:
        f_out.write(json_bytes)


@click.command(short_help="Process schools intersects ")
@click.option(
    "--schools_path",
    help="Schools path csv",
    required=True,
    type=str,
)
@click.option(
    "--antennas_path",
    help="Antennas path",
    required=True,
    type=str,
)
@click.option(
    "--schools_out_path",
    help="Data schools output",
    required=True,
    type=str,
)
@click.option(
    "--file_geojson_path",
    help="File prefix ",
    required=True,
    type=str,
)
def main(schools_path, antennas_path, schools_out_path, file_geojson_path):
    run(schools_path, antennas_path, schools_out_path, file_geojson_path)


if __name__ == "__main__":
    main()
