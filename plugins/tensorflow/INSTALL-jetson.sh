#!/bin/bash
echo "ARM CPU Installation is currently NOT supported! Jetson Nano with GPU enabled is currently only supported."
if [[ ! $(head -1 /etc/nv_tegra_release) =~ R32.*4\.[34] ]] ; then
  echo "ERROR: not JetPack-4.4"
  exit 1
fi

cudaCompute=$(cat /sys/module/tegra_fuse/parameters/tegra_chip_id)
export cudaCompute
# 33 : Nano, TX1
# 24 : TX2
# 25 : Xavier NX and AGX Xavier

DIR=$(dirname "${0}")

echo "Replacing package.json for tfjs 2.3.0..."
cp  "${DIR}/package-jetson.json" "${DIR}/package.json"

echo "Removing existing Tensorflow Node.js modules..."
rm -rf "${DIR}/node_modules"

echo "Installing Yarn package manager"
npm install yarn -g --unsafe-perm --force

[ -d "${DIR}/tfjs-tfjs-v2.3.0" ] && echo "Removing existing Tensorflow source directory"  && rm -rf "${DIR}/tfjs-tfjs-v2.3.0"

echo "Downloading Tensorflow source tarball"
wget -O "${DIR}/tfjs-v2.3.0.tar.gz" https://github.com/tensorflow/tfjs/archive/refs/tags/tfjs-v2.3.0.tar.gz

echo "Extracting and preparing Tensorflow source"
tar -xf tfjs-v2.3.0.tar.gz -C "${DIR}"
(cd "${DIR}/tfjs-tfjs-v2.3.0/tfjs-node-gpu" || exit ; ./prep-gpu.sh)

# Little hack to make it run on jetson and download precompiled binaries
sed -i "s/os.arch() === 'arm'/os.arch() === 'arm64'/ig" "${DIR}/tfjs-tfjs-v2.3.0/tfjs-node-gpu/scripts/install.js"
sed -i "s/https:\/\/storage.googleapis.com\/tf-builds\/libtensorflow_r1_14_linux_arm.tar.gz/https:\/\/cdn.shinobi.video\/binaries\/tensorflow\/2.3.0\/libtensorflow.tar.gz/ig" "${DIR}/tfjs-tfjs-v2.3.0/tfjs-node-gpu/scripts/install.js"

echo "Building Tensorflow Node GPU package"
(cd "${DIR}/tfjs-tfjs-v2.3.0/tfjs-node-gpu" || exit ; yarn && yarn build)

echo "Removing Tensorflow source tarball"
rm -f "${DIR}/tfjs-v2.3.0.tar.gz"

echo "Installing Tensorflow addon"
yarn

echo "Clean Yarn cache"
yarn cache clean --all

# # npm audit fix --force
if [ ! -e "${DIR}/conf.json" ]; then
    echo "Creating conf.json"
    sudo cp "${DIR}/conf.sample.json" "${DIR}/conf.json"
else
    echo "conf.json already exists..."
fi

tfjsBuildVal="gpu"

echo "Adding Random Plugin Key to Main Configuration"
node "${DIR}/../../tools/modifyConfigurationForPlugin.js" tensorflow key="$(head -c 64 < /dev/urandom | sha256sum | awk '{print substr($1,1,60)}')" tfjsBuild="${tfjsBuildVal}"

echo "TF_FORCE_GPU_ALLOW_GROWTH=true" > "${DIR}/.env"
echo "#CUDA_VISIBLE_DEVICES=0,2" >> "${DIR}/.env"

echo "Instalation finished"
echo "For plugin automatic start run: pm2 start shinobi-tensorflow.js && pm2 save"
echo "Or run manualy: node shinobi-tensorflow.js"
echo "To make Shinobi avare of new plugin, restart it by: pm2 restart camera"
