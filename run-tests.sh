#!/bin/bash

# rm -rf build
# truffle migrate

echo "ARGS: $1"
CMD_EXTRA=""
if [[ ! -z "$1" ]]; then
    CMD_EXTRA="| grep $1"
fi;

FILTER_CMD="ls test | grep js $CMD_EXTRA"
echo "FILTER_CMD: $FILTER_CMD"
# for i in $($FILTER_CMD); do
#     echo "js => $i"
# done

for i in `ls test | grep js | grep preSale`; do
    echo $i
    TESTRPC_CMD="testrpc -a 10 -l 40000000000000"
    $TESTRPC_CMD 1>/dev/null &
    TRUFFLE_CMD="truffle test test/$i"
    $TRUFFLE_CMD
    if [ $? != 0 ]; then
        echo "Failed to execute $TRUFFLE_CMD"
        exit -1
    fi
    pid=`ps -ef | grep testrpc | grep -v grep | cut -d' ' -f4`
    kill -9 $pid
done