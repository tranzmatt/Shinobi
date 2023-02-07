echo "deb https://repo.download.nvidia.com/jetson/ffmpeg main main" | sudo tee -a /etc/apt/sources.list.d/nvidia-ffmpeg.list
echo "deb-src https://repo.download.nvidia.com/jetson/ffmpeg main main" | sudo tee -a /etc/apt/sources.list.d/nvidia-ffmpeg.list
sudo apt update 
sudo apt install -y ffmpeg=7:4.2.2-nvidia.1
if [ $? -ne 0 ]; then
    echo "can't install compiled version , compiling from source instaead"
    apt source ffmpeg   
    cd ffmpeg-4.2.7/  
    sudo apt install -y libegl1-mesa-dev 
    sudo apt install -y pkg-config  
    ./configure --enable-nvv4l2dec --enable-libv4l2 --enable-shared --extra-libs="-L/usr/lib/aarch64-linux-gnu/tegra -lnvbuf_utils" --extra-cflags="-I /usr/src/jetson_multimedia_api/include/"    
    make -j 2   
    sudo make install    
    export LD_LIBRARY_PATH=/usr/local/lib/   
    sudo ldconfig
elif `ffmpeg -decoders | grep -q 'nvv4l2' > /dev/null 2>&1` ; then
   echo "installed ffmpeg with HW Acceleration"
else
   echo "Failed to install ffmpeg with HW Acceleration"
fi
