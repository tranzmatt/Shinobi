# Shinobi Video plugin for DeepStack Object Detection

### How to Install DeepStack Object Detection on GPU

> [This document has been rewritten over on ShinobiHub Articles.](https://hub.shinobi.video/articles/view/PcBtEgGuWuEL529)

# Additional Information

Docker - [Get docker](https://docs.docker.com/get-docker/)

DeepStack - [Getting started](https://docs.deepstack.cc/getting-started/index.html#setting-up-deepstack)

Run DeepStack CPU docker image:
```
sudo docker run -e VISION-FACE=True -e VISION-DETECTION=True -v localstorage:/datastore -p 80:5000 deepquestai/deepstack
```

GPU [installation guide](https://docs.deepstack.cc/using-deepstack-with-nvidia-gpus/#step-1-install-docker)

#### More installation options
[Windows (CPU / GPU support)](https://docs.deepstack.cc/windows/index.html)

[nVidia Jetson](https://docs.deepstack.cc/nvidia-jetson/index.html#using-deepstack-with-nvidia-jetson)

[Raspberry PI](https://docs.deepstack.cc/raspberry-pi/index.html#using-deepstack-on-raspberry-pi-alpha)
