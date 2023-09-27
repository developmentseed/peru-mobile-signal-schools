FROM ghcr.io/osgeo/gdal:ubuntu-small-latest

RUN apt update && apt-get install -y python3-pip unrar

RUN pip install \
  tqdm \
  rasterio \
  click \
  geopandas \
  geojson \
  joblib \
  rio-cogeo \
  requests \
  rarfile \
  mercantile

WORKDIR /mnt
