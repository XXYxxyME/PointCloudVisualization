
var DBdata;
function initIndexedDB(){

    var wrequest = window.indexedDB.open("customdata26T1", 1);

    wrequest.onerror = () => {
        console.log('数据库打开报错');
    };

    wrequest.onsuccess = (ev) => {

        DBdata = ev.target.result;
        console.log('Hello,数据库打开成功');

    };

    wrequest.onupgradeneeded = (ev) => {

        DBdata = ev.target.result;
        console.log('数据库新建成功');
        if (!DBdata.objectStoreNames.contains('Nodes')) {
            DBdata.createObjectStore('Nodes',{keyPath:"name"});
        }
    };
}

function createindexedDB(nodeName, cloudData) {
    var request = window.indexedDB.open("xxx", 1);
    var db;
    request.onerror = () => {
        console.log('数据库打开报错');
    };

    request.onsuccess = (ev) => {

        db = ev.target.result;
        console.log('数据库打开成功');
        pushDB(db, nodeName, cloudData);
    };

    request.onupgradeneeded = (ev) => {

        db = ev.target.result;
        if (!db.objectStoreNames.contains('Nodes')) {
            db.createObjectStore('Nodes',{keyPath:"name"});
        }
        pushDB(db, nodeName, cloudData);
    };

}

function pushDB(db, nodeName, cloudData) {

    var request = db.transaction(['Nodes'], 'readwrite')
        .objectStore('Nodes')
        .get(nodeName);

    request.onerror = function(event) {
        console.log('事务失败');
    };

    request.onsuccess = function( event) {
        var cursor=event.target.result;
        if (cursor) {
            //更新数据，主要是防止之前没有读数据
            if(request.result.data == null){
                var updateReq = db.transaction(['Nodes'], 'readwrite')
                    .objectStore('Nodes')
                    .put({ name: nodeName, data: cloudData });

                updateReq.onsuccess = function (event) {
                    console.log('数据更新成功');
                };

                updateReq.onerror = function (event) {
                    console.log('数据更新失败');
                }
            }
            else{
                console.log('数据已经存在');
            }
        } else {
            var addReq = db.transaction(['Nodes'], 'readwrite')
                .objectStore('Nodes')
                .add({ name: nodeName, data: cloudData });

            addReq.onsuccess = function (event) {
                console.log('新数据插入成功');
            };

            addReq.onerror = function (event) {
                console.log('新数据插入失败');
            }
        }
    };
}

function update(nodeName, cloudData) {

    var request = db.transaction(['Nodes'], 'readwrite')
        .objectStore('Nodes')
        .put({ name: nodeName, data: cloudData });

    request.onsuccess = function (event) {
        console.log('数据更新成功');
    };

    request.onerror = function (event) {
        console.log('数据更新失败');
    }
}

function addDB(nodeName, nodeGeometry) {

    var request = db.transaction(['Nodes'], 'readwrite')
        .objectStore('Nodes')
        .add({ name: nodeName, data: nodeGeometry });

    request.onsuccess = function (event) {

        console.log('数据插入成功');
    };

    request.onerror = function (event) {

    }
}

function addToIndexDB(toFarNodes) {

    for(let i = 0; i < toFarNodes.length; i++){

        let request = db.transaction(['Nodes'], 'readwrite')
            .objectStore('Nodes').add({ name: toFarNodes[i], data: Pco.nodes[toFarNodes[i]].geometry });

        request.onsuccess = function (event) {
            //memoryNode.remove(toFarNodes[i]);

            Pco.nodes[toFarNodes[i]].geometry = null;
            $.data(cloudsData, toFarNodes[i], 0);
            console.log('数据插入成功');

        };

        request.onerror = function (event) {
            //memoryNode.remove(toFarNodes[i]);
            Pco.nodes[toFarNodes[i]].geometry = null;
            console.log('数据重复插入');
        }
    }
}

function readFromIndexDB(nodeName) {

    var transaction = db.transaction(['Nodes'], 'readwrite');
    var objectStore = transaction.objectStore('Nodes');
    var request = objectStore.get(nodeName);

    request.onerror = function(event) {
        console.log(request.error);
    };

    request.onsuccess = function(event) {

        if (request.result) {
            if (request.result.data != null) {

                indexQueue = request.result.data;
                flag.indexTableFlag = 1;
                console.log('当前浏览器中缓存有节点', indexQueue.length, '个');

            }
        }
        else{
            console.log('之前没有缓存啊');
            flag.indexTableFlag = 1;
        }

    };

}


function readNodesFromIndexDB(nodesInDB) {

    for(let i = 0; i < nodesInDB.length; i++){

        let request = db.transaction(['Nodes'], 'readonly')
            .objectStore('Nodes').get(nodesInDB[i]);

        request.onerror = function(event) {

            console.log(request.error);
        };

        request.onsuccess = function(event) {

            if (request.result) {
                if (request.result.positionArray != null) {

                    try{

                        let positionBuffer = new THREE.BufferAttribute(request.result.positionArray, 3);
                        let levelBuffer = new THREE.BufferAttribute(request.result.levelArray, 1);
                        //Pco.nodes[nodesInDB[i]].geometry = new THREE.BufferGeometry();
                        Pco.nodes[nodesInDB[i]].geometry.addAttribute('position', positionBuffer);
                        Pco.nodes[nodesInDB[i]].geometry.addAttribute('level', levelBuffer);
                        completedLoadedNodes.push(nodesInDB[i]);
                        //drawSingleNode(nodesInDB[i]);

                    }
                    catch(e){

                        console.log(nodesInDB[i], Pco.nodes[nodesInDB[i]]);
                    }

                }
                else{
                    //console.log(i, nodesInDB[i],'数据库读取失败');
                }
            }
            else{
                console.log(i, nodesInDB[i], request.result);
            }

        };
    }

}

function readFromIndexDB_2(nodeName) {

    var transaction = db.transaction(['Nodes'], 'readwrite');
    var objectStore = transaction.objectStore('Nodes');
    var request = objectStore.get(nodeName);

    request.onerror = function(event) {
        console.log(request.error);
    };

    request.onsuccess = function(event) {

        if (request.result) {
            if (request.result.data != null) {

                Pco.nodes[nodeName].geometry = request.result.data;
            }
        }

    };
}

function dataQueue(){
    this.dataStore = [];
    this.enqueue = function (element){

        this.dataStore.push(element);
    };//入队

    this.dequeue = function(){
        return this.dataStore.shift();
    };//出队

    this.front = function(){
        return this.dataStore[0];
    };    //读取队首元素

    this.back = function(){
        return this.dataStore[this.dataStore.length - 1];
    };      //读取队尾元素

    this.empty = function(){

        if(this.dataStore.length === 0){
            return true;
        }else{
            return false;
        }
    };

    this.length = function(){
        return this.dataStore.length;
    };

    this.clear = function(){
        this.dataStore = [];
    };

}

//initIndexedDB();

