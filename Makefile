all : api sync

api :
	./bin.js -d -v -i schema

sync :
	./sync.sh
	