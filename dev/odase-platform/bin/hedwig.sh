#!/bin/sh

DIR=${0%/*}
case $WINDIR in
   '') SEP=':' ;;
   *)  SEP=';' ;;
esac

INSTALL_DIR=`dirname $0`
echo $INSTALL_DIR
JAVA_CLASSPATH=$CLASSPATH

JAVA_LIBS_DIR=$INSTALL_DIR
for jar in `ls $JAVA_LIBS_DIR/*.jar`
do
	JAVA_CLASSPATH=$jar${SEP}$JAVA_CLASSPATH
done

echo $JAVA_CLASSPATH

java -Xss10m $JAVA_OPTIONS -cp "$JAVA_CLASSPATH" jmercury.hedwig $@
