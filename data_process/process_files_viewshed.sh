#!/bin/bash

dataDir=data
outputGeojsonDir=${dataDir}/geojson

mkdir -p $outputGeojsonDir

function process_file {
  file="$1"
  value=$(echo $file | awk -F'/' '{print $(NF-0)}' | cut -d'_' -f1)
  dataDir=data
  outputGeojsonDir=${dataDir}/geojson

  if [[ ! -e "${outputGeojsonDir}/${value}.geojson" ]]; then
    echo "process ${outputGeojsonDir}/${value}.geojson"
    ogr2ogr -f "GeoJSON" \
      -s_srs EPSG:3857 \
      -t_srs EPSG:4326 \
      -simplify 40 \
      ${outputGeojsonDir}/${value}.geojson \
      $file \
      -where "Value = '1'"
  else
    echo "File ${outputGeojsonDir}/${value}.geojson exists, skipping"
  fi
}

export -f process_file

find ${dataDir}/viewshed/*.geojson | xargs -P $(nproc) -I {} bash -c "process_file {}"
