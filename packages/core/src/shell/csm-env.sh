#!/bin/sh
# Usage: source path/to/csm-env.sh

get_script_dir() {
    if [ -n "$BASH_SOURCE" ]; then
        dirname "$BASH_SOURCE"
    elif [ -n "$ZSH_VERSION" ]; then
        dirname "${(%):-%x}"
    else
        dirname "$0"
    fi
}

SCRIPT_DIR=$(get_script_dir)
CSM_SH="$SCRIPT_DIR/csm.sh"

if [ -f "$CSM_SH" ]; then
    eval "$("$CSM_SH" load-env --shell sh)"
else
    echo "Error: csm.sh not found in $SCRIPT_DIR"
fi
