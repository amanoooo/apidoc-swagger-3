all : api

api :
	./bin.js -d -v -i schema

sync :
	./sync.sh
	