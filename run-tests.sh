#!/bin/bash
rm -rf build
truffle migrate

for i in `ls test | grep js`; do
    echo $i;
    cmd="testrpc -a 10 -l 40000000000000"
    $cmd 1>/dev/null &
    truffle test test/$i
    pid=`ps -ef | grep testrpc | grep -v grep | cut -d' ' -f4`
    kill -9 $pid
done