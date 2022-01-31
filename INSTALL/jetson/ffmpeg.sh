sudo apt-get install -y libunistring-dev gnutls-bin gnutls-dev libiec61883-dev libchromaprint-dev libavc1394-dev libbs2b-dev libcaca-dev libdc1394-22-dev libgme-dev libgsm1-dev libmp3lame-dev libopenjp2-7-dev libopenmpt-dev libopus-dev libpulse-dev librsvg2-dev librubberband-dev libshine-dev libsnappy-dev libsoxr-dev libssh-dev libspeex-dev libtheora-dev libtwolame-dev libvpx-dev libwavpack-dev libwebp-dev libx265-dev libxml2-dev libxvidcore-dev libzmq3-dev libzvbi-dev libomxil-bellagio-dev libopenal-dev libsdl2-dev
git clone https://github.com/jocover/jetson-ffmpeg.git
cd jetson-ffmpeg
mkdir build
cd build
cmake ..
make
sudo make install
sudo ldconfig

git clone git://source.ffmpeg.org/ffmpeg.git -b release/4.2 --depth=1
cd ffmpeg
wget https://github.com/jocover/jetson-ffmpeg/raw/master/ffmpeg_nvmpi.patch
git apply ffmpeg_nvmpi.patch
./configure --enable-nvmpi --prefix=/usr --extra-version=0ubuntu0.2 --toolchain=hardened --libdir=/usr/lib/aarch64-linux-gnu --incdir=/usr/include/aarch64-linux-gnu --enable-gpl --enable-gnutls --disable-stripping --enable-avisynth --enable-libass --enable-libbs2b --enable-libcaca --enable-libfontconfig --enable-libfreetype --enable-libfribidi --enable-libgme --enable-libgsm --enable-libmp3lame --enable-libopenjpeg --enable-libopenmpt --enable-libopus --enable-libpulse --enable-librubberband --enable-librsvg --enable-libshine --enable-libsnappy --enable-libsoxr --enable-libspeex --enable-libssh --enable-libtheora --enable-libtwolame --enable-libvorbis --enable-libvpx --enable-libwavpack --enable-libwebp --enable-libx265 --enable-libxml2 --enable-libxvid --enable-libzmq --enable-libzvbi --enable-omx --enable-openal --enable-opengl --enable-sdl2 --enable-libdc1394 --enable-libdrm --enable-libiec61883 --enable-libx264 --enable-shared
make
sudo apt-get remove --purge -y libunistring-dev gnutls-bin gnutls-dev libiec61883-dev libchromaprint-dev libavc1394-dev libbs2b-dev libcaca-dev libdc1394-22-dev libgme-dev libgsm1-dev libmp3lame-dev libopenjp2-7-dev libopenmpt-dev libopus-dev libpulse-dev librsvg2-dev librubberband-dev libshine-dev libsnappy-dev libsoxr-dev libssh-dev libspeex-dev libtheora-dev libtwolame-dev libvpx-dev libwavpack-dev libwebp-dev libx265-dev libxml2-dev libxvidcore-dev libzmq3-dev libzvbi-dev libomxil-bellagio-dev libopenal-dev libsdl2-dev
