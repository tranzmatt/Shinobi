#!/bin/sh
echo "------------------------------------------"
echo "-- Installing CUDA Toolkit and CUDA DNN --"
echo "------------------------------------------"
# Install CUDA Drivers and Toolkit
if [ -x "$(command -v apt)" ]; then
    # CUDA Toolkit
    echo "Choose to Install CUDA Toolkit without Drivers!"
    wget https://developer.download.nvidia.com/compute/cuda/11.2.0/local_installers/cuda_11.2.0_460.27.04_linux.run
    sudo sh cuda_11.2.0_460.27.04_linux.run
    cudaLibPath="/usr/local/cuda-11.2/lib64"
    grep -qxF $cudaLibPath /etc/ld.so.conf || echo "$cudaLibPath" >> /etc/ld.so.conf
    sudo ldconfig

    # Driver
    echo "Installing nvidia-driver-515-server"
    sudo apt install nvidia-driver-515-server

    # Install CUDA DNN
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/libcudnn8_8.1.1.33-1+cuda11.2_amd64.deb -O cuda-dnn.deb
    sudo dpkg -i cuda-dnn.deb
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/libcudnn8-dev_8.1.1.33-1+cuda11.2_amd64.deb -O cuda-dnn-dev.deb
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
