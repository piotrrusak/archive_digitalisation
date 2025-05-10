import os
import requests

base_url = "https://tile.loc.gov/storage-services/master/mss/mgw/mgw1a/002/{:03d}.jpg"

save_folder = "./dataset"


os.makedirs(save_folder, exist_ok=True)


for num in range(1, 113):
    if num == 17:
        continue
    url = base_url.format(num)
    print(f"Downloading {url}...")

    response = requests.get(url)
    if response.status_code == 200:
        filename = os.path.join(save_folder, f"{num:03d}.jpg")
        with open(filename, 'wb') as f:
            f.write(response.content)
        print(f"Saved {filename}")
    else:
        print(
            f"Failed to download {url} (Status code: {response.status_code})")

print("Download completed.")
