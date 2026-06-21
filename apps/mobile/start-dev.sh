#!/bin/bash
# iPhone から接続できるよう Windows の LAN IP を使って Metro を起動する
export REACT_NATIVE_PACKAGER_HOSTNAME=192.168.11.19
npx expo start --host lan
