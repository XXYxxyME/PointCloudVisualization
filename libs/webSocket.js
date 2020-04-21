
class WEBSocket{

    constructor(url) {

        this.lockReconnect = false;
        this.wsUrl = url;
        this.wsocket = null;
        this.name = null;
        this.time = null;

    }

    createWebSocket(){

        try {

            this.wsocket = new WebSocket(this.wsUrl);
            this.websocketInit();

        }catch (e) {

            console.log(e);

        }
    }


    websocketInit(){

        this.wsocket.name = this.name;
        this.wsocket.timeout = 5000;
        this.wsocket.structure = this;
        this.wsocket.timeoutObj = null;
        this.wsocket.serverTimeoutObj = null;
        this.wsocket.binaryType = "arraybuffer";//可以指定接收的二进制流数据是arraybuffer
        this.wsocket.onopen = () => {

            console.log( this.name + '连接开启...');

            if(this.name === 'socket0' && flag.jsFlag === 0){

                let type = 'js';
                let tableName = 'PointCloud';
                //let tableName = 'streetTxtData';
                let dataName = 'cloud';
                pool.sockets[0].createWebRequest(type, tableName, dataName);

            }
            this.wsocket.isbusy = false;
            star(this.wsocket);

        };

        this.wsocket.onmessage = function (event) {

            star(this);
            //只有心跳检测会返回文本类型
            if (typeof event.data === "string") {
                console.log(event.data);
            }

            if (event.data instanceof ArrayBuffer) {

                let buffer = event.data;
                let bufferView = new DataView(buffer);
                let responseType = bufferView.getUint8(0);
                if(responseType === 0){

                   //console.info(this.name, "接收到心跳检测！");

                }else if(responseType === 1){

                    this.isbusy = false;
                    makeHttpRequestByPool2();
                    //makeHttpRequestByOne();
                    let dataNameLen = bufferView.getUint8(1);

                    let dataNameBytes = [];
                    for(let i = 0; i < dataNameLen; i++){

                        dataNameBytes.push(bufferView.getUint8(i+2))
                    }

                    let nodeName = decodeUtf8(dataNameBytes);
                    let type = nodeName.split('.')[1];
                    nodeName = nodeName.split('.')[0];

                   if(type === 'js'){

                       let result = pako.ungzip(buffer.slice(dataNameLen + 2,buffer.byteLength));
                       let jsonBuffer = decodeUtf8(result);
                       analyseSelfJS(jsonBuffer);

                   }
                   else if(type === 'hrc'){

                       let result = pako.ungzip(buffer.slice(dataNameLen + 2,buffer.byteLength));
                       analyzeSelfHrc(nodeName ,result);

                   }
                   else if(type === 'bin'){

                       if(nodeName[0] >= '0'&&nodeName[0] <= '9'){
                           nodeName = nodeName.slice(1,nodeName.length);
                       }

                       //let worker = workerPool.getWorker(workerPath);
                       let worker = workerPool.getCorrespondingThread('libs/readBin.js', Pco.nodes[nodeName].analysisFlag);
                       var nodeData = {

                           "dataNameLen": dataNameLen,
                           "nodeName": nodeName,
                           "buffer": buffer,
                           "scale": Pco.scale[0],
                           "boxX": Pco.nodes[nodeName].boundingBox.min.x,
                           "boxY": Pco.nodes[nodeName].boundingBox.min.y,
                           "boxZ": Pco.nodes[nodeName].boundingBox.min.z,
                           "level": Pco.nodes[nodeName].level,
                           "tightBoxX": Pco.tightBoundingBox.max.x,
                           "tightBoxY": Pco.tightBoundingBox.max.y,
                           "tightBoxZ": Pco.tightBoundingBox.max.Z,
                       };

                       worker.postMessage(nodeData, [nodeData.buffer]);

                       worker.onmessage = function (message) {

                           let nodeName = message.data.name;
                           //workerPool.returnWorker(workerPath, worker);
                           Pco.nodes[nodeName].analysisFlag = 88;

                           let positionBuffer = new THREE.BufferAttribute(message.data.positionArray, 3);
                           let levelBuffer = new THREE.BufferAttribute(message.data.levelArray, 1);

                           Pco.nodes[nodeName].geometry.addAttribute('position', positionBuffer);
                           Pco.nodes[nodeName].geometry.addAttribute('level', levelBuffer);

                           completedLoadedNodes.push(nodeName);
                           //drawSingleNode(nodeName);

                       };

                   }
                }
            }
        };

        this.wsocket.onerror = function(err){

            console.log(this.name, "error");
            let id = this.name[6];
            reconnect(pool.sockets[id]);
        };

        this.wsocket.onclose = function (evt) {

            let id = this.name[6];
            console.log(this.name, "onclose", evt);
            reconnect(pool.sockets[id]);
         };
    }

    createWebRequest(type, tableName, nodeName, filterStr){

        this.wsocket.isbusy = true;

        let requestType, requestBodyJson;
        if(type == 'bin'){

            if(filterStr == 'one'){

                requestType = 1;
                requestBodyJson = {
                    'dataType': type,
                    'tableName' : tableName,
                    'dataName' : nodeName,
                };

            }
            else{
                requestType = 2;
                requestBodyJson = {
                    'dataType': type,
                    'tableName' : tableName,
                    'parentNodeKey' : nodeName,
                    'childNodeFilterStr' : filterStr,
                };

            }
        }
        else{
            requestType = 1;
            requestBodyJson = {
                'dataType': type,
                'tableName' : tableName,
                'dataName' : nodeName,
            };
        }

        let requestBodyBytes = encodeUtf8(JSON.stringify(requestBodyJson));

        let requestx = new ArrayBuffer(requestBodyBytes.length+1);
        let dataView = new DataView(requestx);
        dataView.setUint8(0,requestType);
        for (let i = 0;i < requestBodyBytes.length;i++){

            dataView.setUint8(i+1,requestBodyBytes[i])
        }

        this.wsocket.send(dataView);

    }
}

function reconnect(socket) {

    console.log(socket.name, '尝试重连中');
    if (socket.lockReconnect) {       // 是否已经执行重连

        return;
    }
    socket.lockReconnect = true;
    socket.time && clearTimeout(socket.time);
    //没连接上会一直重连，设置延迟避免请求过多
    socket.time = setTimeout(function () {
        socket.createWebSocket();
        socket.lockReconnect = false;
    }, 2000);
}

function star(wsocket){

    //console.info(wsocket.name,'开始心跳测试');
    wsocket.timeoutObj && clearTimeout(wsocket.timeoutObj);
    wsocket.serverTimeoutObj && clearTimeout(wsocket.serverTimeoutObj);

    wsocket.timeoutObj = setTimeout(function () {
        //发送心跳测试测试信息
        var tick = new Uint8Array(1);
        tick[0] = 0;
        if(wsocket.readyState === 1) {
            wsocket.send(tick);
        }
        wsocket.serverTimeoutObj = setTimeout(function () {
            //如果未收到服务器返回的心跳信息，则关闭连接，关闭会导致reconnect
            console.log(wsocket.name, '未收到心跳,断开');
            wsocket.close();

        }, wsocket.timeout);

    }, 2000)
}

class wsocketPool{

    constructor(url){

        this.sockets = [];
        this.url = url;
    }

    createSockets(){

        for(let i = 0; i < webSocketNumber; i++){

            this.sockets[i] = new WEBSocket(this.url);
            this.sockets[i].name = 'socket' + i;
            this.sockets[i].ID = i;
            this.sockets[i].createWebSocket();
        }
    }

    getOne(){

        for(let i = 0; i < webSocketNumber; i++){

            if(this.sockets[i].wsocket.isbusy === false){

                return this.sockets[i];
            }
        }
        return null;
    }

}

function analyzeSelfHrc(nodeName, hbuffer){

    let view = new DataView(hbuffer.buffer);
    let stack = [];
    let children = view.getUint8(0);

    stack.push({children: children,  name: 'r'});
    let decoded = [];
    let offset = 1;
    while (stack.length > 0) {
        let node = stack.shift();
        let mask = 1;
        for (let i = 0; i < 8; i++) {
            if ((node.children & mask) !== 0) {
                let childName = node.name + i;
                let childChildren = view.getUint8(offset);
                stack.push({children: childChildren, name: childName});
                decoded.push({children: childChildren,  name: childName});
                offset += 1;
            }
            mask = mask * 2;
        }

        if (offset === hbuffer.byteLength) {
            break;
        }
    }

    for( let i = 0; i < stack.length; i++){

        if((stack[i].name.length - 1)%5 === 0){
            hrcName.push(stack[i].name);
        }

    }

    for (let i = 0; i < decoded.length; i++) {

        let name = decoded[i].name;
        let index = parseInt(name.charAt(name.length - 1));

        let parentName = name.substring(0, name.length - 1);
        let parentNode = Pco.nodes[parentName];
        let level = name.length - 1;
        let boundingBox = Utils.createChildAABB(parentNode.boundingBox, index);

        let currentNode = new pointCloudTreeNode(name, boundingBox);
        currentNode.level = level;
        currentNode.hasChildren = decoded[i].children > 0;
        currentNode.spacing = Pco.spacing / Math.pow(2, level);
        parentNode.addChild(currentNode);
        Pco.nodes[name] = currentNode;

    }
    init();
    animate();
    decideAndDraw();
    console.log('hrc文件解析成功');
    //testTree();
}

function analyseSelfJS(buffer){
    try {
        let MyJS = JSON.parse(buffer);
        console.log(MyJS);
        //整棵树
        let pco = new pointCloudOctreeGeometry();
        //pco.spacing = fMno.spacing;
        pco.spacing = 10.0;
        pco.hierarchyStepSize = MyJS.hierarchyStepSize;
        pco.pointAttributes = MyJS.pointAttributes;
        pco.scale = MyJS.scale;

        let min = new THREE.Vector3(MyJS.boundingBox.lx, MyJS.boundingBox.ly, MyJS.boundingBox.lz);
        minx = MyJS.boundingBox.lx;
        miny = MyJS.boundingBox.ly;
        minz = MyJS.boundingBox.lz;
        let max = new THREE.Vector3(MyJS.boundingBox.ux, MyJS.boundingBox.uy, MyJS.boundingBox.uz);
        let boundingBox = new THREE.Box3(min, max);
        let tightBoundingBox = boundingBox.clone();

        if (MyJS.tightBoundingBox) {
            tightBoundingBox.min.copy(new THREE.Vector3(MyJS.tightBoundingBox.lx, MyJS.tightBoundingBox.ly, MyJS.tightBoundingBox.lz));
            tightBoundingBox.max.copy(new THREE.Vector3(MyJS.tightBoundingBox.ux, MyJS.tightBoundingBox.uy, MyJS.tightBoundingBox.uz));
        }

        let offset = min.clone();

        boundingBox.min.sub(offset);
        boundingBox.max.sub(offset);
//
        //boundingBox.max.x = boundingBox.max.x / 10;
        //boundingBox.max.y = boundingBox.max.y / 10;
        //boundingBox.max.z = boundingBox.max.z / 10;
//
        tightBoundingBox.min.sub(offset);
        tightBoundingBox.max.sub(offset);

        pco.projection = MyJS.projection;
        pco.boundingBox = boundingBox;
        pco.tightBoundingBox = tightBoundingBox;
        pco.boundingSphere = boundingBox.getBoundingSphere(new THREE.Sphere());
        pco.tightBoundingSphere = tightBoundingBox.getBoundingSphere(new THREE.Sphere());
        pco.offset = offset;

        let name = 'r';
        let root = new pointCloudTreeNode(name, boundingBox);
        root.level = 0;
        root.hasChildren = true;
        root.spacing = pco.spacing;
        pco.root = root;
        let nodes = {};
        nodes['r'] = root;
        pco.nodes = nodes;
        Pco = pco;
        console.log('Json文件解析成功');
        flag.jsFlag = 1;
        let type = 'hrc';
        let dataName = 'r';//hrc
        let tableName = 'customdata26Gnoclod';//customdata26Gnoclod PointCloud
        pool.sockets[0].createWebRequest(type, tableName, dataName);


    }
    catch (e) {
        console.log(e);
    }
}