import click
import json
from geojson import FeatureCollection as fc
from shapely.geometry import shape, mapping
import overpass
from tqdm import tqdm
from joblib import Parallel, delayed
import geopandas as gpd
import gzip

PERU_ADM0_LINK = "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbHumanitarian/PER/ADM0/geoBoundaries-PER-ADM0_simplified.geojson"
KEEP_TAGS = [
    "addr:district",
    "addr:province",
    "addr:subdistrict",
    "addr:full",
    "name",
    "source",
    "addr:city",
    "addr:street",
    "addr:housenumber",
]


def line2point(feature):
    sha = shape(feature.get("geometry"))
    feature["geometry"] = mapping(sha.centroid)
    return feature


def featureinboundary(feature, boundary_shape):
    sha = shape(feature.get("geometry"))
    if boundary_shape.contains(sha):
        old_props = feature.get("properties")
        new_props = {}
        for i in KEEP_TAGS:
            v = old_props.get(i)
            if v:
                key = i.split(":")[-1]
                new_props[key] = v
        feature["properties"] = new_props
        return feature
    return None


def run(boundary_path, features_out):
    feature_boundary = gpd.read_file(PERU_ADM0_LINK)
    feature_boundary.crs = "EPSG:4326"
    feature_boundary.to_file(boundary_path, driver="GeoJSON")

    feature_geojson = json.loads(feature_boundary.to_json()).get("features")
    feature = feature_geojson[0]
    shape_boundary = shape(feature.get("geometry"))
    bbox_original = list(shape_boundary.bounds)
    bbox = tuple(
        [bbox_original[1], bbox_original[0], bbox_original[3], bbox_original[2]]
    )
    api = overpass.API(timeout=1800)
    query = f"""
            (
              node["amenity"="school"]{str(bbox)};
              way["amenity"="school"]{str(bbox)};
            );
                """

    response = api.get(query, verbosity="geom").get("features")

    features_fix = Parallel(n_jobs=-1)(
        delayed(line2point)(feature) for feature in tqdm(response, desc="fix geom")
    )

    new_features = Parallel(n_jobs=-1)(
        delayed(featureinboundary)(feature, shape_boundary)
        for feature in tqdm(features_fix, desc="feature in boundary")
    )

    new_features = [i for i in new_features if i]
    # sage geojson
    json.dump(fc(new_features), open(features_out, "w"))



@click.command(short_help="Download overpass")
@click.option("--boundary_path", help="boundary geojson", required=True, type=str)
@click.option("--features_out", help="data geojson", required=True, type=str)
def main(boundary_path, features_out):
    run(boundary_path, features_out)


if __name__ == "__main__":
    main()
