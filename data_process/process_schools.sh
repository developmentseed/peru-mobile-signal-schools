#!/usr/bin/env bash

dataDir=data
outputDir=$dataDir/output
mkdir -p $outputDir

gdaldocker="docker run --rm -v $PWD:/mnt/ -it developmentseed/peru-mobile"

# ============
# download schools
# ============
#$gdaldocker python prepare_school_data.py \
#  --boundary_path=${outputDir}/bounday.geojson \
#  --features_out=${outputDir}/features_school.geojson

# ============
# generate intersects
## ============
$gdaldocker python generate_schools_intersects.py \
  --schools_path=${outputDir}/features_school.geojson \
  --antennas_path=${outputDir}/cobertura_app_4326.geojson \
  --schools_out_path=${outputDir}/features_school_intersects.geojson \
  --schools_out_bbox_path=${outputDir}/features_school_bbox.geojson \
  --file_geojson_path=${dataDir}/geojson
