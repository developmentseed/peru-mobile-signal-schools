import click
import json
import requests
import re
from rarfile import RarFile
import os
from tqdm import tqdm
from joblib import Parallel, delayed

URL_LINK = "https://geoservidorperu.minam.gob.pe/geoservidor/download_raster.aspx"
URL_PATH = str("/".join(URL_LINK.split("/")[:-1]))


def download_rar(url_file, path_folder):
    try:
        filename = str(url_file.split("/")[-1].split(".")[0])
        response = requests.get(f"{URL_PATH}/{url_file}", stream=True, verify=False)

        with open(f"{path_folder}/{filename}.rar", "wb") as file:
            for chunk in response.iter_content(chunk_size=8192):
                file.write(chunk)

        with RarFile(f"{path_folder}/{filename}.rar") as rf:
            rf.extractall(path_folder)
    except Exception as ex:
        print(ex)


def run(dem_folder):
    response = requests.get(URL_LINK, verify=False)
    html_text = response.text
    urls = list(re.findall(r'<area [^>]*?href="([^"]+)"', html_text))
    if not urls:
        raise ValueError("No urls found")

    download_results = Parallel(n_jobs=-1)(
        delayed(download_rar)(url_, dem_folder)
        for url_ in tqdm(urls, desc=f"Download data ")
    )


@click.command(short_help="Download dem files ")
@click.option(
    "--dem_folder",
    help="Geojson input",
    required=True,
    type=str,
)
def main(dem_folder):
    run(dem_folder)


if __name__ == "__main__":
    main()
