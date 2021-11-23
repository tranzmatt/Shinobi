#!/bin/sh
echo "------------------------------------------"
echo "-- Installing CUDA Toolkit and CUDA DNN --"
echo "------------------------------------------"
# Install CUDA Drivers and Toolkit
if [ -x "$(command -v apt)" ]; then
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
    sudo mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
    wget http://developer.download.nvidia.com/compute/cuda/11.0.2/local_installers/cuda-repo-ubuntu2004-11-0-local_11.0.2-450.51.05-1_amd64.deb
    sudo dpkg -i cuda-repo-ubuntu2004-11-0-local_11.0.2-450.51.05-1_amd64.deb
    sudo apt-key add /var/cuda-repo-ubuntu2004-11-0-local/7fa2af80.pub

    sudo apt-get update -y

    sudo apt-get -o Dpkg::Options::="--force-overwrite" install  cuda-toolkit-11-0 -y --no-install-recommends
    sudo apt-get -o Dpkg::Options::="--force-overwrite" install --fix-broken -y
    sudo apt install nvidia-utils-495 nvidia-headless-495 -y

    # Install CUDA DNN
    wget https://cdn.shinobi.video/installers/libcudnn8_8.2.1.32-1+cuda11.3_amd64.deb -O cuda-dnn.deb
    sudo dpkg -i cuda-dnn.deb
    wget https://cdn.shinobi.video/installers/libcudnn8-dev_8.2.0.53-1+cuda11.3_amd64.deb -O cuda-dnn-dev.deb
    sudo dpkg -i cuda-dnn-dev.deb
    echo "-- Cleaning Up --"
    # Cleanup
    sudo rm cuda-dnn.deb
    sudo rm cuda-dnn-dev.deb
fi
echo "------------------------------"
echo "Reboot is required. Do it now?"
echo "------------------------------"
echo "(y)es or (N)o. Default is No."
read rebootTheMachineHomie
if [ "$rebootTheMachineHomie" = "y" ] || [ "$rebootTheMachineHomie" = "Y" ]; then
    sudo reboot
fi
