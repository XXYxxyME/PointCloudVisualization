
const XHRFactory0 = {
    config: {
        withCredentials: false,
        customHeaders: [
            { header: null, value: null }
        ]
    },

    createXMLHttpRequest: function () {
        let xhr = new XMLHttpRequest();

        if (this.config.customHeaders &&
            Array.isArray(this.config.customHeaders) &&
            this.config.customHeaders.length > 0) {
            let baseOpen = xhr.open;
            let customHeaders = this.config.customHeaders;
            xhr.open = function () {
                baseOpen.apply(this, [].slice.call(arguments));
                customHeaders.forEach(function (customHeader) {
                    if (!!customHeader.header && !!customHeader.value) {
                        xhr.setRequestHeader(customHeader.header, customHeader.value);
                    }
                });
            };
        }

        return xhr;
    }
};


function readUsingDataView(event) {

    let buffer = event.arrayb;
    let numPoints = event.pointsCount;
    let sourcePointSize = event.pointSize;
    let pointFormatID = 2;
    let scale = event.scale;

    let offset = event.offset ;
    let offset1 = [];
    for(var i = 0; i < 3; i++)
    {
        offset1[i]= 1/2*(event.maxs[i] - event.mins[i]);
    }

    let sourceUint8 = new Uint8Array(buffer);
    let sourceView = new DataView(buffer);

    let targetPointSize = 40;
    let targetBuffer = new ArrayBuffer(numPoints * targetPointSize);
    let targetView = new DataView(targetBuffer);

    let tightBoundingBox = {
        min: [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
        max: [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]
    };

    let mean = [0, 0, 0];

    let pBuff = new ArrayBuffer(numPoints * 3 * 4);
    let cBuff = new ArrayBuffer(numPoints * 4);
    let iBuff = new ArrayBuffer(numPoints * 4);
    let clBuff = new ArrayBuffer(numPoints);
    let rnBuff = new ArrayBuffer(numPoints);
    let nrBuff = new ArrayBuffer(numPoints);
    let psBuff = new ArrayBuffer(numPoints * 2);

    let positions = new Float32Array(pBuff);
    let colors = new Uint8Array(cBuff);
    let intensities = new Float32Array(iBuff);
    let classifications = new Uint8Array(clBuff);
    let returnNumbers = new Uint8Array(rnBuff);
    let numberOfReturns = new Uint8Array(nrBuff);
    let pointSourceIDs = new Uint16Array(psBuff);


    for (let i = 0; i < numPoints; i++) {
        // POSITION
        let ux = sourceView.getInt32(i * sourcePointSize + 0, true);
        let uy = sourceView.getInt32(i * sourcePointSize + 4, true);
        let uz = sourceView.getInt32(i * sourcePointSize + 8, true);
        x = ux * scale[0] + offset[0] - minx;
        y = uy * scale[1] + offset[1] - miny;
        z = uz * scale[2] + offset[2] - minz;


        positions[3 * i + 0] = x;
        positions[3 * i + 1] = z;
        positions[3 * i + 2] = y;

        mean[0] += x / numPoints;
        mean[1] += y / numPoints;
        mean[2] += z / numPoints;

        tightBoundingBox.min[0] = Math.min(tightBoundingBox.min[0], x);
        tightBoundingBox.min[1] = Math.min(tightBoundingBox.min[1], y);
        tightBoundingBox.min[2] = Math.min(tightBoundingBox.min[2], z);

        tightBoundingBox.max[0] = Math.max(tightBoundingBox.max[0], x);
        tightBoundingBox.max[1] = Math.max(tightBoundingBox.max[1], y);
        tightBoundingBox.max[2] = Math.max(tightBoundingBox.max[2], z);

        // INTENSITY
        let intensity = sourceView.getUint16(i * sourcePointSize + 12, true);
        intensities[i] = intensity;

        // RETURN NUMBER, stored in the first 3 bits - 00000111
        // number of returns stored in next 3 bits   - 00111000
        let returnNumberAndNumberOfReturns = sourceView.getUint8(i * sourcePointSize + 14, true);
        let returnNumber = returnNumberAndNumberOfReturns & 0b0111;
        let numberOfReturn = (returnNumberAndNumberOfReturns & 0b00111000) >> 3;
        returnNumbers[i] = returnNumber;
        numberOfReturns[i] = numberOfReturn;

        // CLASSIFICATION
        let classification = sourceView.getUint8(i * sourcePointSize + 15, true);
        classifications[i] = classification;

        // POINT SOURCE ID
        let pointSourceID = sourceView.getUint16(i * sourcePointSize + 18, true);
        pointSourceIDs[i] = pointSourceID;

        // COLOR, if available
        if (pointFormatID === 2) {
            let r = sourceView.getUint16(i * sourcePointSize + 20, true) / 256;
            let g = sourceView.getUint16(i * sourcePointSize + 22, true) / 256;
            let b = sourceView.getUint16(i * sourcePointSize + 24, true) / 256;

            colors[4 * i + 0] = r;
            colors[4 * i + 1] = g;
            colors[4 * i + 2] = b;
            colors[4 * i + 3] = 255;
        }
    }

    let indices = new ArrayBuffer(numPoints * 4);
    let iIndices = new Uint32Array(indices);
    for (let i = 0; i < numPoints; i++) {
        iIndices[i] = i;
    }
    var data =[colors, positions, tightBoundingBox];
    return data;
}


class LasLazBatcher {
    constructor(Geometry) {
        this.Geometry = Geometry;
    }
    push(lasBuffer, nodeName) {

        var e = readUsingDataView(lasBuffer);

        var size = Pco.nodes[nodeName].spacing;
        let geometry = new THREE.BufferGeometry();
        let positions = new Float32Array(e[1]);
        let colors = new Uint8Array(e[0]);
        var levels = new Float32Array(positions.length / 3);

        for (let i = 0; i < levels.length; i++) {
            levels[i] = Math.random() + Pco.nodes[nodeName].level;
        }

        let positionArray = new THREE.BufferAttribute(positions, 3);
        let levelArray = new THREE.BufferAttribute(levels, 1);

        geometry.addAttribute('position', positionArray);
        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 4, true));
        geometry.addAttribute('level', levelArray);

        let tightBoundingBox = new THREE.Box3(
            new THREE.Vector3().fromArray(e[2].min),
            new THREE.Vector3().fromArray(e[2].max)
        );

        geometry.boundingBox = Pco.nodes[nodeName].boundingBox;

        let swap1 = tightBoundingBox.max.y;
        tightBoundingBox.max.y = tightBoundingBox.max.z;
        tightBoundingBox.max.z = swap1;
        let swap2 = tightBoundingBox.min.y;
        tightBoundingBox.min.y = tightBoundingBox.min.z;
        tightBoundingBox.min.z = swap2;

        Pco.nodes[nodeName].tightBoundingBox = tightBoundingBox;
        Pco.nodes[nodeName].tightSphereBoundingBox = tightBoundingBox.getBoundingSphere(new THREE.Sphere());
        Pco.nodes[nodeName].geometry = geometry;

        //geometry.dispose();
        lasBuffer = null;

/*
        let pcolor = null;
        switch (Pco.nodes[nodeName].level) {
            case 0:pcolor = 0xff0000;break;
            case 1:pcolor = 0x0000ff;break;
            case 2:pcolor = 0x00ff00;break;
            case 3:pcolor = 0xffff00;break;
            default:pcolor = 0xff0000;break;
        }
        let material = new THREE.PointsMaterial({
            //size: size,
            size: 0.1,
            color: pcolor,
            //vertexColors: THREE.VertexColors,
            transparent: true,
            opacity: 1
            //sizeAttenuation: false
        });

        //Pco.nodes[nodeName].object = new THREE.Points(geometry, material);
        Pco.nodes[nodeName].object = new THREE.Points(geometry, material);*/
    }


}

class LasLazLoader {
    constructor () {
    }

    load (url, nodeName) {

        Pco.nodes[nodeName].xhr = new XMLHttpRequest();
        let node = Pco.nodes[nodeName];
        node.xhr.open('GET', url, true);
        node.xhr.responseType = 'arraybuffer';

        node.xhr.onreadystatechange = () => {

            if (node.xhr.readyState === 4) {
                if (node.xhr.status === 200 || node.xhr.status === 0) {

                    if(node.xhr.response == null){
                        return;
                    }

                    $.data(cloudsData, nodeName, 1);
                    this.parse(node.xhr.response, nodeName);

                } else {
                    console.log('Failed to load file! HTTP status: ' + xhr.status + ', file: ' + url);
                }
            }
        };
        node.xhr.send(null);
    }
    load2 (url, nodeName) {

        let node = Pco.nodes[nodeName];
        node.xhr = new XMLHttpRequest();
        //处理较高的层级，判断数据库
        if(nodeName.length - 1 > 4) {
            var transaction = db.transaction(['Nodes'], 'readwrite');
            var objectStore = transaction.objectStore('Nodes');
            var request = objectStore.get(nodeName);

            request.onerror = function (event) {
                console.log('该查询请求错误');
            };
            request.onsuccess = function (event) {
                if (request.result) {
                    if (request.result.data != null) {
                        loader.parse(request.result.data, nodeName);
                    }
                } else {

                    node.xhr.open('GET', url, true);
                    node.xhr.responseType = 'arraybuffer';
                    node.xhr.onreadystatechange = () => {

                        if (node.xhr.readyState === 4) {
                            if (node.xhr.status === 200 || node.xhr.status === 0) {

                                let buffer = node.xhr.response;
                                if (buffer == null) {
                                    return;
                                }
                                addDB(nodeName, buffer);
                                loader.parse(buffer, nodeName);

                            } else {
                                console.log('Failed to load file! HTTP status: ' + xhr.status + ', file: ' + url);
                            }
                        }
                    };
                    node.xhr.send(null);
                }
            };

        }//处理较小层级，放入缓存数据结构
        else{

            node.xhr.open('GET', url, true);
            node.xhr.responseType = 'arraybuffer';
            node.xhr.onreadystatechange = () => {

                if (node.xhr.readyState === 4) {
                    if (node.xhr.status === 200 || node.xhr.status === 0) {

                        let buffer = node.xhr.response;
                        if (buffer == null) {
                            return;
                        }
                        loader.parse(buffer, nodeName);

                    } else {
                        console.log('Failed to load file! HTTP status: ' + xhr.status + ', file: ' + url);
                    }
                }
            };
            node.xhr.send(null);
        }


    }

    parse(buffer, nodeName){

        let lf = new LASFile(buffer);
        let handler = new LasLazBatcher();

        lf.open()
            .then( msg => {
                lf.isOpen = true;
                return lf;
            }).catch( msg => {
            console.log("failed to open file. :(");
        }).then( lf => {
            return lf.getHeader().then(function (h) {
                return [lf, h];
            });
        }).then( v => {
            let lf = v[0];
            let header = v[1];

            let skip = 1;
            let totalRead = 0;
            let reader = function () {
                let p = lf.readData(1000000, 0, skip);
                return p.then(function (data) {

                    handler.push(new LASDecoder(data.buffer,
                        header.pointsFormatId,
                        header.pointsStructSize,
                        data.count,
                        header.scale,
                        header.offset,
                        header.mins, header.maxs), nodeName);
                    totalRead += data.count;

                    if (data.hasMoreData) {
                        return reader();
                    } else {
                        header.totalRead = totalRead;
                        header.versionAsString = lf.versionAsString;
                        header.isCompressed = lf.isCompressed;
                        return [lf, header, handler];
                    }
                });
            };

            return reader();
        }).then( v => {
            let lf = v[0];

            return lf.close().then(function () {
                lf.isOpen = false;
                return v.slice(1);
            }).catch(e => {
                if (lf.isOpen) {
                    return lf.close().then(function () {
                        lf.isOpen = false;
                        throw e;
                    });
                }
                throw e;
            });
        });
    }
}


function Queue(){
    this.dataStore = [];
    this.enqueue = enqueue;//入队
    this.dequeue = dequeue;//出队
    this.front = front;    //读取队首元素
    this.back = back;      //读取队尾元素
    this.empty = empty;
    this.length = length;
    this.clear = clear;
    this.toString = toString;
}

//入队
function enqueue(element){
    this.dataStore.push(element);//在数组末尾添加元素
}

//出队
function dequeue(){
    return this.dataStore.shift();//shift()删除数组第一个元素并返回
}

//读取队首元素
function front(){
    return this.dataStore[0];
}

//读取队尾元素
function back(){
    return this.dataStore[this.dataStore.length-1];
}

//判空
function empty(){
    if(this.dataStore.length == 0){
        return true;
    }else{
        return false;
    }
}

//清空
function clear(){
    this.dataStore = [];
}

//返回队列长度
function length(){
    return this.dataStore.length;
}

//toString
function toString() {
    return this.dataStore;
}

function sleep(delay)
{
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

function Stack() {
    this.dataStore = [];
    this.top = 0;
    this.push = push;
    this.pop = pop;
    this.peek = peek;
    this.clear = clear;
    this.length = length;
    this.empty = empty;
}

function push(element) {
    this.dataStore[this.top++] = element;
}


function peek() {
    return this.dataStore[this.top - 1];
}

function pop() {
    return this.dataStore.pop();
}

function clear() {
    this.top = 0;
}
