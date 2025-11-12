#!/bin/bash
SCRIPT_DIR=$(dirname "$(realpath "$0")")
cd "$SCRIPT_DIR" || exit 1


rm -rf data
rm -rf input

cp -r data_backup data
cp -r input_backup input