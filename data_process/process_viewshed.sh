#!/usr/bin/env bash

dataDir=data
outputDir=$dataDir/output
outputGeojsonDir=$dataDir/geojson

mkdir -p $dataDir/dem
mkdir -p $outputDir
mkdir -p $outputGeojsonDir

gdaldocker="docker run --rm -v $PWD:/mnt/ -it developmentseed/peru-mobile"

# ============
# Download data
# ============

#$gdaldocker python3 download_dem_data.py \
#          --dem_folder=${dataDir}/dem

#$gdaldocker gdalbuildvrt \
#      ${dataDir}/peru.vrt  ${dataDir}/dem/*.tif

#$gdaldocker gdal_translate \
#      -co "COMPRESS=LZW" \
#      -co PREDICTOR=2 \
#      -co "TILED=YES" \
#      ${dataDir}/peru.vrt ${dataDir}/peru_dem.tif

#$gdaldocker gdalwarp \
#            -of GTiff \
#            -t_srs EPSG:3857 -overwrite -q  \
#            -dstnodata 0.0 \
#            ${dataDir}/peru_dem.tif \
#            ${outputDir}/peru_dem_3857.tif
# ============
# prepate antennas
# ============

#curl "https://www.datosabiertos.gob.pe/sites/default/files/Cobertura%20m%C3%B3vil%20por%20empresa%20operadora.csv" \
#      --output $dataDir/cobertura.csv

#$gdaldocker python prepare_signal_data.py \
#          --csv_path=${dataDir}/cobertura.csv \
#          --output_file=${outputDir}/cobertura_3857.geojson \
#          --output_app_file=${outputDir}/cobertura_app_4326.geojson

# ============
# calculate viewshed
# ============

#$gdaldocker python3 calculate_viewshed.py \
#  --dem_input=${outputDir}/peru_dem_3857.tif \
#  --points=${outputDir}/cobertura_3857.geojson \
#  --folder_viewhead=${dataDir}/viewshed \
#  --observer_height=30 \
#  --output_geojson_bbox=${outputDir}/vector_viewshed_bbox_4326.geojson

# ============
# convert geojsons
# ============
#chmod +x process_files_viewshed.sh
$gdaldocker  /mnt/process_files_viewshed.sh

#mkdir -p ../data_process_anteas/data_process_antenas/geojson
#cp -rf $outputGeojsonDir/*  ../data_process_anteas/data_process_antenas/geojson
