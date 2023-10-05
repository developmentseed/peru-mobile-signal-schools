#!/usr/bin/env bash

dataDir=data
outputDir=$dataDir/output
mkdir -p $outputDir

gdaldocker="docker run --rm -v $PWD:/mnt/ -it developmentseed/peru-mobile"

# ============
# download schools
# ============
$gdaldocker python prepare_school_data.py \
  --boundary_path=$dataDir/output/bounday.geojson \
  --features_out=$dataDir/output/features_school.geojson

# ============
# generate intersects
# ============
