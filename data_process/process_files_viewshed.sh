#!/bin/bash

dataDir=data
outputDir=$dataDir/output
outputGeojsonDir=$dataDir/geojson

mkdir -p $outputDir
mkdir -p $outputGeojsonDir

for file in $(find ${dataDir}/viewshed/* -type f -name "*_30.geojson"); do
  value=$(echo $file | awk -F'/' '{print $(NF-0)}' | cut -d'_' -f1)
  echo " process $file"
  ogr2ogr -f "GeoJSON" \
    -s_srs EPSG:3857 \
    -t_srs EPSG:4326 \
    -simplify 40 \
    ${outputGeojsonDir}/${value}.geojson \
    $file \
    -where "Value = '1'"
done
