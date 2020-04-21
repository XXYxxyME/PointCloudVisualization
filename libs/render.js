
let xy = 1;
let qq = 0;

function DLOD(){

    parameterInit();

    var frustum = new THREE.Frustum();
    frustum.setFromMatrix( new THREE.Matrix4().multiplyMatrices( three.camera.projectionMatrix,three.camera.matrixWorldInverse ) );
    var que = new Queue();
    que.enqueue(Pco.nodes['r']);

    while(que.empty()===false) {

        var node = que.dequeue();
        if (frustum.intersectsBox(node.boundingBox)){

            var distanceFromCameraToNode = minDistanceFromEyeToBox(node.boundingBox);
            var relLevel = clodJudge(distanceFromCameraToNode, node.level);
            if (relLevel <= node.level) {

                if(node.level === 0){

                    node.isRendered = true;
                }

            } else {

                node.isRendered = true;
                let children = node.getChildren();
                for (let i = 0; i < children.length; i++) {

                    let child = children[i];
                    var distanceFromCameraToChild = minDistanceFromEyeToBox(child.boundingBox);
                    var relChildLevel = clodJudge(distanceFromCameraToChild, child.level);
                    //子节点有一个需要绘制，该节点就不绘制
                    if(relChildLevel > child.level){

                        node.isRendered = false;

                    }
                }
                //证明节点被分割
                if(node.isRendered === false){
                    for (let i = 0; i < children.length; i++){

                        let child = children[i];
                        var distanceFromCameraToChild2 = minDistanceFromEyeToBox(child.boundingBox);
                        var relChildLevel2 = clodJudge(distanceFromCameraToChild2, child.level);
                        if(relChildLevel2 > child.level){

                            que.enqueue(child);
                        }
                        else{
                            child.isRendered = true;
                        }
                    }
                }
            }
        }
    }
    testTree();
    makeRequest();
}
//计算两点之间的长度
function length(p1, p2){

    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));
}

//判断视点与包围盒的最小距离
function minDistanceFromEyeToBox(boundingbox) {

    let x = three.camera.position.x;
    let y = three.camera.position.y;
    let z = three.camera.position.z;
    let point =  new THREE.Vector3(x, y, z);
    //如果视点在包围盒内部，则为0
    if(boundingbox.containsPoint(point)){
        return 0;
    }
    else{
        if(x < boundingbox.min.x){
            x = boundingbox.min.x;
        }
        else if(x > boundingbox.max.x){
            x = boundingbox.max.x;
        }

        if(y < boundingbox.min.y){
            y = boundingbox.min.y;
        }
        else if(y > boundingbox.max.y){
            y = boundingbox.max.y;
        }

        if(z < boundingbox.min.z){
            z = boundingbox.min.z;
        }
        else if(z > boundingbox.max.z){
            z = boundingbox.max.z;
        }

        return Math.sqrt(Math.pow(three.camera.position.x - x, 2) * xy + Math.pow(three.camera.position.y - y, 2) + Math.pow(three.camera.position.z - z, 2) * xy);
    }

}

function maxDistanceFromEyeToBox(boundingbox) {

    let x = three.camera.position.x;
    let y = three.camera.position.y;
    let z = three.camera.position.z;

    if(x < boundingbox.min.x){
        x = boundingbox.max.x;
    }
    else if(x > boundingbox.max.x){
        x = boundingbox.min.x;
    }
    else{
        x = (boundingbox.max.x - x) > (x - boundingbox.min.x)? boundingbox.max.x : boundingbox.min.x;
    }

    if(y < boundingbox.min.y){
        y = boundingbox.max.y;
    }
    else if(y > boundingbox.max.y){
        y = boundingbox.min.y;
    }
    else{
        y = (boundingbox.max.y - y) > (y - boundingbox.min.y)? boundingbox.max.y : boundingbox.min.y;
    }

    if(z < boundingbox.min.z){
        z = boundingbox.max.z;
    }
    else if(z > boundingbox.max.z){
        z = boundingbox.min.z;
    }
    else{
        z = (boundingbox.max.z - z) > (z - boundingbox.min.z)? boundingbox.max.z : boundingbox.min.z;
    }

    return Math.sqrt(Math.pow(three.camera.position.x - x, 2) * xy + Math.pow(three.camera.position.y - y, 2) + Math.pow(three.camera.position.z - z, 2) * xy);

}

function clodJudge(D, level){

    let relLevel = gui.maxLevel - D * level / gui.far * gui.maxLevel;
    return relLevel;
}

function parameterInit(){

    drawQueue.length = 0;
    requestQueue.length = 0;
    memoryQueue.length = 0;
    nodesInDB.length = 0;
    completedLoadedNodes.length = 0;
    vector.combination.length = 0;
    drawNewNodesQueue.length = 0;

    flag.webNum = 0;
    flag.completedRenderNodeNumber = 0;
    flag.pointsNum = 0;
    flag.dbpointsNum = 0;
    flag.liyonglv = 0;

    gui.currentMaxLevel = 2;

}

function calFrustumPlanes(frustum){

    let frustumplanes = [];

    for(let i = 0; i < 6; i++){

        frustumplanes.push(frustum.planes[i].normal.x);
        frustumplanes.push(frustum.planes[i].normal.y);
        frustumplanes.push(frustum.planes[i].normal.z);
        frustumplanes.push(frustum.planes[i].constant);

    }

    return frustumplanes;
}
//计算当前位置处的需求节点
function judegeVisibleNodes() {

    parameterInit();
    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));
    let planes = calFrustumPlanes(frustum);

    let que = new Queue();
    que.enqueue(Pco.nodes['r']);
    let analysisFlag = 0;

    while (que.empty() === false) {

        let node = que.dequeue();
        //小于最小绘制等级的只渲染一次
        if(node.level <= three.mustRenderLevel){

            let children = node.getChildren();
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                que.enqueue(child);
            }

            drawQueue.push(node.name);
        }
        else{

            if (frustum.intersectsBox(node.boundingBox)) {

                let level = node.level;
                let minDis = minDistanceFromEyeToBox(node.boundingBox);
                let relLevel = clodJudge(minDis, level);

                if (relLevel > level && relLevel - level > 0.2) {

                    let children = node.getChildren();
                    for (let i = 0; i < children.length; i++) {
                        let child = children[i];
                        que.enqueue(child);
                    }

                    drawQueue.push(node.name);

                }
                else{
                    continue;
                }
            }
            else{
                continue;
            }
        }

        //旧点变为新点
        if(three.scene.getObjectByName(node.name) !== undefined){
            /*
            //渲染率高保留
            if(node.renderRate >= 0.5){

                drawQueue.push(node.name);
                continue;
            }//否则重新绘制
            else{

                let data = three.scene.getObjectByName(node.name);
                data.geometry.dispose();
                data.material.dispose();
                three.scene.remove(data);
            }*/
            flag.pointsNum = flag.pointsNum + three.scene.getObjectByName(node.name).geometry.attributes['level'].array.length;
            document.getElementById("pointsNum").value = '总点数:' + flag.pointsNum;
            three.scene.getObjectByName(node.name).isOld = false;
            three.scene.getObjectByName(node.name).material.uniforms.frustumPlanes = {
                type: 'vec4', value: planes
            };

            continue;
        }
        else{
            drawNewNodesQueue.push(node.name);
        }

        //新的节点
        if(memoryNode.indexOf(node.name) === -1){

            if(flag.indexTableFlag === 1 && indexQueue.indexOf(node.name) !== -1){

                nodesInDB.push(node.name);
            }
            else{

                analysisFlag = analysisFlag === navigator.hardwareConcurrency? 0: analysisFlag;
                node.analysisFlag = analysisFlag;
                requestQueue.push(node.name);//服务器中的节点
                analysisFlag++;
            }
        }
        else{

            memoryQueue.push(node.name);
        }
    }

    console.log('需要绘制的节点总数有（包括新旧点）',drawQueue.length);

    removeOldPoints();
    makeRequest();

    for(let i = 0; i < memoryQueue.length; i++){

        GPU_CLOD_Render(memoryQueue[i]);
    }

}
//requestQueue不一定有
function combine(){

    let m = 0;
    let lastNode = requestQueue[0];
    vector.combination[0] = [];
    vector.combination[0].push(requestQueue[0]);
    for(let i = 1; i < requestQueue.length; i++){

        let node = requestQueue[i];

        if(node.length !== lastNode.length){
            m++;
            vector.combination[m] = [];
            vector.combination[m].push(node);
        }
        else{
            let n = node.slice(0,node.length - 1);
            let ln = lastNode.slice(0,lastNode.length - 1);

            if(n == ln){
                vector.combination[m].push(node);
            }
            else{
                m++;
                vector.combination[m] = [];
                vector.combination[m].push(node);
            }
        }
        lastNode = requestQueue[i];
    }

    //测试用
    //let p = [];
    //for(var value of vector.combination ){
    //    p.push(value);
    //}
    //console.log('组合后', p, vector.combination.length);
}

//将不在内存中的节点放到requestqueue中
function judgeWhere() {

    let norequestNodeNumber = 0;

    for(let i = 0; i < drawQueue.length; i++){

        let nodeName = drawQueue[i];
        if(Pco.nodes[nodeName].geometry == null){

            requestQueue.push(nodeName);
        }
        else{
            norequestNodeNumber++;
        }

    }

    makeRequest();

}
//发送对数据库中节点的请求，剩下的节点需要去网申
function makeRequest() {

    document.getElementById("report").value = '内存：'+ memoryQueue.length +' 数据库：' + nodesInDB.length + ' 服务器：'+ requestQueue.length;
    readNodesFromIndexDB(nodesInDB);

    if(requestQueue.length !== 0){

        combine();
        makeHttpRequestByPool1();
    }

    //makeHttpRequest1();

}

function pickIndex(arr){

    let index = '';
    let key = arr[0].slice(0, arr[0].length - 1);
    for (let str of arr) {
        index += str.charAt(str.length-1);
    }
    let a = [];
    a[0] = key; a[1] = index;
    return a;
}

//网络XMLHTTPRequest第一版
function makeHttpRequest() {

    if(requestQueue.length === 0){
        return;
    }
    for(let i = 0; i < requestQueue.length;i++){

        if(i === 6){
            break;
        }
        let nodeName = requestQueue[i];
        let url = nodeurl + nodeName;
        XMLHttp.sendRequest("GET", url,null, nodeName, analyzebuffer, makeHttpRequest);
    }

}
//网络XMLHTTPRequest第二版
function makeHttpRequest1() {

    if(requestQueue.length === 0){
        return;
    }
    let num = 0;
    while(num < 6) {

        num++;
        if (requestQueue.length <= 0) {

            return;

        } else {

            let nodeName = requestQueue[0];
            let url = nodeurl + (nodeName.length - 1) + nodeName;
            //requestQueue.remove(nodeName);
            requestQueue.shift();
            XMLHttp.sendRequest("GET", url, null, nodeName, makeHttpRequest2);
            console.log(requestQueue.length, '11', nodeName);
        }
    }
}
//XMLHTTPRequest回调
function makeHttpRequest2() {

    if(requestQueue.length === 0){

        return;
    }

    let nodeName = requestQueue[0];
    requestQueue.shift();

    let url = nodeurl + (nodeName.length - 1) + nodeName;
    XMLHttp.sendRequest("GET", url,null, nodeName, makeHttpRequest2);
    console.log(requestQueue.length, '22', nodeName);
}
//webSocker
function makeHttpRequestByPool1() {

    let type = 'bin';
    let tableName = '';//PointCloud customdata26Gnoclod
    let parentNodeKey;
    let childNodeFilterStr;
    try {
        if (vector.combination.length !== 0) {

            let num = 0;
            while(num < webSocketNumber){

                if(vector.combination.length === 0){

                    break;
                }
                if (pool.sockets[num].wsocket.readyState === 1) {

                    if(vector.combination[0]){

                        if(vector.combination[0].length > 1) {

                            tableName = 'PointCloud';
                            let ki = pickIndex(vector.combination[0]);
                            parentNodeKey = ki[0];
                            childNodeFilterStr = ki[1];

                            pool.sockets[num].createWebRequest(type, tableName, parentNodeKey, childNodeFilterStr);

                        }
                        else{

                            tableName = 'PointCloud';
                            let nodeName = vector.combination[0][0];
                            if(typeof(nodeName) == 'undefined' ){

                                return;
                            }

                            pool.sockets[num].createWebRequest(type, tableName, nodeName.length - 1 + nodeName,'one');

                        }
                    }

                    vector.combination.shift();

                }
                num++;
            }
        }
    }
    catch (e) {
        console.log(e);
    }

}
//webSocker回调
function makeHttpRequestByPool2() {

    let type = 'bin';
    let tableName = '';
    let parentNodeKey;
    let childNodeFilterStr;
    try {
        if (vector.combination.length !== 0) {

            let socket = pool.getOne();

            if(socket == null){

                console.log('all busy');
                return;
            }

            if(socket.wsocket.readyState === 1) {

                if(vector.combination[0].length > 1) {

                    tableName = 'PointCloud';
                    let ki = pickIndex(vector.combination[0]);
                    parentNodeKey = ki[0];
                    childNodeFilterStr = ki[1];
                    vector.combination.shift();
                    socket.createWebRequest(type, tableName, parentNodeKey, childNodeFilterStr);
                }
                else{

                    tableName = 'PointCloud';
                    let nodeName = vector.combination[0][0];
                    if(typeof(nodeName) == 'undefined' ){
                        return;
                    }
                    vector.combination.shift();
                    socket.createWebRequest(type, tableName, nodeName.length - 1 + nodeName,'one');

                }


            }
        }
    }
    catch (e) {
        console.log(e);
    }

}

function makeHttpRequestByOne() {

    let type = 'bin';
    let tableName = 'customdata26G';
    try {
        if (requestQueue.length !== 0) {

            let nodeName = requestQueue[0];
            requestQueue.shift();

            if(ws0.wsocket.readyState === 1) {
                ws0.createWebRequest(type, tableName, nodeName);
            }
        }
    }
    catch (e) {

    }

}

function judgeBeforeNodes(){

    drawBeforeQueue.length = 0;
    for(let i = 0; i < memoryNode.length; i++) {

        let node = Pco.nodes[memoryNode[i]];
        let level = node.level;
        let minDis = minDistanceFromEyeToBox(node.boundingBox);
        let relLevel = gui.maxLevel - minDis * level * 2.0 / gui.far * gui.maxLevel;

        if (relLevel > level) {
            //符合clod筛选
            drawBeforeQueue.push(memoryNode[i]);

        } else {
            //不符合clod筛选
        }

    }
    //console.log(drawQueue);
    console.log('before', drawBeforeQueue);
}

function drawNode(pco){

    let x = three.camera.position.x;
    let y = three.camera.position.y;
    let z = three.camera.position.z;

    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));

    for(let j = 0; j < drawQueue.length; j++)
    {
        if( pco.nodes[drawQueue[j]].geometry && pco.nodes[drawQueue[j]].isDraw === false){

            pco.nodes[drawQueue[j]].isDraw = true;

            if(memoryNode.indexOf(drawQueue[j]) === -1){

                memoryNode.push(drawQueue[j]);
            }

            let size, vs, fs;
            let positions = [];
            let colors = [];

            let extraPositions = [];
            let extraColors = [];

            let geometry = new THREE.BufferGeometry();
            let extrageometry = new THREE.BufferGeometry();

            {
                size = 3.0;
                vs = Shaders["vshader"];

                if (gui.HQ === false) {

                    fs = Shaders["low_fshader"];

                } else {
                    fs = Shaders["high_fshader"];
                }
            }

            let uniforms = {
                size: {
                    type: 'float', value: size//pco.nodes[drawQueue[j]].spacing
                },
                screenHeight: {
                    type: 'float', value: window.innerHeight
                },
                far: {
                    type: 'float', value: three.camera.far
                },
                near: {
                    type: 'float', value: three.camera.near
                }
            };

            let shaderMaterial = new THREE.ShaderMaterial({

                uniforms: uniforms,
                vertexShader: vs,
                fragmentShader: fs,

            });
            shaderMaterial.transparent = false;
            shaderMaterial.side = THREE.DoubleSide;
            //shaderMaterial.blending = THREE.AdditiveBlending;

            let needed = 0;
            for (let i = 0; i < pco.nodes[drawQueue[j]].geometry.attributes['position'].count; i++) {

                let px = pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i];
                let py = pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i + 1];
                let pz = pco.nodes[drawQueue[j]].geometry.attributes['position'].array[3 * i + 2];
                let level = pco.nodes[drawQueue[j]].geometry.attributes['level'].array[i];
                let isInFrustum = frustum.containsPoint(new THREE.Vector3(px, py, pz));
                if (isInFrustum || level <= three.mustRenderLevel+1) {
                //if (isInFrustum) {
                    //needed++;
                    let r = pco.nodes[drawQueue[j]].geometry.attributes['color'].array[4 * i];
                    let g = pco.nodes[drawQueue[j]].geometry.attributes['color'].array[4 * i + 1];
                    let b = pco.nodes[drawQueue[j]].geometry.attributes['color'].array[4 * i + 2];

                    let dx = Math.pow(px - x, 2);
                    let dy = Math.pow(py - y, 2);
                    let dz = Math.pow(pz - z, 2);

                    let dis = Math.sqrt(dx + dy + dz);
                    let relDis = clodJudge(dis, level);
                    //let relDis = gui.maxLevel - dis * level * 2.0 / gui.far * gui.maxLevel;

                    if (level < relDis || level <= three.mustRenderLevel+1) {
                    //if (level < relDis) {
                        let lel = pco.nodes[drawQueue[j]].geometry.attributes['level'].array[i] - pco.nodes[drawQueue[j]].level;
                        positions.push(px, py, pz);

                        if(gui.LOD === true) {
                            //colors.push(r / 255.0, g / 255.0, b / 255.0, 1);
                            switch (pco.nodes[drawQueue[j]].level) {
                                case 0:
                                    colors.push(128.0/255.0, 0, 128.0/255.0, dis / 10.0);
                                    break;
                                case 1:
                                    colors.push((128.0 - 128 * lel)/255.0, 0, (128.0 + 127.0 * lel)/255.0, dis / 10.0);
                                    break;
                                case 2:
                                    colors.push(0, (139.0 * lel)/255.0, (255 - 116 * lel)/255.0, dis / 10.0);
                                    break;
                                case 3:
                                    colors.push(0, (139 + 116 * lel)/255.0, (139 - 139 * lel)/255.0, dis / 10.0);
                                    break;
                                case 4:
                                    colors.push(lel, 1, 0, dis / 10.0);
                                    break;
                                case 5:
                                    colors.push(1, (255 - 90 * lel)/ 255.0, 0, dis / 10.0);
                                    break;
                                case 6:
                                    colors.push(1, (165 - 165 * lel)/255.0, 0, dis / 10.0);
                                    break;
                                case 7:
                                    colors.push(1, 1, 1, dis / 10.0);
                                    break;
                                case 8:
                                    colors.push(0, 0, 0, 1);
                                    break;
                            }
                        }
                        else {
                            let relZ = pz - parseInt(pz);
                            if(pz > 2){
                                relZ = (pz - 2)*1;
                                colors.push(1, (165 - 165 * relZ)/255.0, 0, dis / 10.0);
                            }
                            else if(pz > 1.5){
                                relZ = (pz - 1.5)*2;
                                colors.push(1, (255 - 90 * relZ)/ 255.0, 0, dis / 10.0);
                            }
                            else if(pz > 1.0){
                                relZ = (pz - 1.0)*2;
                                colors.push(relZ, 1, 0, dis / 10.0);
                            }
                            else if(pz > 0.5){
                                relZ = (pz - 0.5)*2;
                                colors.push(0, (139 + 116 * relZ)/255.0, (139 - 139 * relZ)/255.0, dis / 10.0);
                            }
                            else if(pz > 0){
                                relZ = (pz - 0)*2;
                                colors.push(0, (139.0 * relZ)/255.0, (255 - 116 * relZ)/255.0, dis / 10.0);
                            }

                            /*
                            let relZ = pz - parseInt(pz);
                            if(pz > 20){
                                relZ = (pz - 20)*0.1;
                                colors.push(1, (165 - 165 * relZ)/255.0, 0, 1);
                            }
                            else if(pz > 15){
                                relZ = (pz - 15)*0.2;
                                colors.push(1, (255 - 90 * relZ)/ 255.0, 0, 1.0);
                            }
                            else if(pz > 10){
                                relZ = (pz - 10)*0.2;
                                colors.push(relZ, 1, 0, 1);
                            }
                            else if(pz > 5){
                                relZ = (pz - 5)*0.2;
                                colors.push(0, (139 + 116 * relZ)/255.0, (139 - 139 * relZ)/255.0, 1);
                            }
                            else if(pz > 0){
                                relZ = (pz - 0)*0.2;
                                colors.push(0, (139.0 * relZ)/255.0, (255 - 116 * relZ)/255.0, 1);
                            }
                             */
                        }
                    }
                }
                //绘制在视椎体外部等级小于3的节点
                /*
                else{
                    if(level <= 3){
                        extraPositions.push(px, py, pz);
                        let relY = py - parseInt(py);
                        if(py > 2){
                            relY = py - 2;
                            extraColors.push(1, (165 - 165 * relY)/255.0, 0, 1);
                        }
                        else if(py > 1.5){
                            relY = (py - 1.5)*2;
                            extraColors.push(1, (255 - 90 * relY)/ 255.0, 0, 1.0);
                        }
                        else if(py > 1){
                            relY = (py - 1)*2;
                            extraColors.push(relY, 1, 0, 1);
                        }
                        else if(py > 0.5){
                            relY = (py - 0.5)*2;
                            extraColors.push(0, (139 + 116 * relY)/255.0, (139 - 139 * relY)/255.0, 1);
                        }
                        else if(py > 0){
                            relY = (py - 0)*2;
                            extraColors.push(0, (139.0 * relY)/255.0, (255 - 116 * relY)/255.0, 1);
                        }
                    }
                }*/
            }

            //console.log(drawQueue[j],needed,pco.nodes[drawQueue[j]].geometry.attributes['position'].count,needed/pco.nodes[drawQueue[j]].geometry.attributes['position'].count);
            //aa = aa + pco.nodes[drawQueue[j]].geometry.attributes['position'].count;
            //zz = zz + needed;

            let colorAttribute = new THREE.Float32BufferAttribute(colors, 4 );
            geometry.addAttribute('acolor', colorAttribute);

            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
            //geometry.addAttribute('color', new THREE.BufferAttribute(new Uint8Array(colors), 4, true));

            let pcloud = new THREE.Points(geometry, shaderMaterial);

            if(pco.nodes[drawQueue[j]].level <= three.mustRenderLevel){

                pcloud.name = drawQueue[j];

            }
            else{

                pcloud.name = drawQueue[j];

            }

            three.scene.add(pcloud);
            
            if(extraColors.length !== 0){

                var extracolorAttribute = new THREE.Float32BufferAttribute(extraColors, 4 );
                extrageometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(extraPositions), 3));
                extrageometry.addAttribute('acolor', extracolorAttribute);

                let extrauniforms = {
                    size: {
                        type: 'float', value: 3.0
                    },
                    screenHeight: {
                        type: 'float', value: window.innerHeight
                    },
                    far: {
                        type: 'float', value: three.camera.far
                    },
                    near: {
                        type: 'float', value: three.camera.near
                    }
                };

                let extrashaderMaterial = new THREE.ShaderMaterial({

                    uniforms: extrauniforms,
                    vertexShader: vs,
                    fragmentShader: fs,

                });
                extrashaderMaterial.transparent = false;

                let extrapcloud = new THREE.Points(extrageometry, extrashaderMaterial);
                extrapcloud.name = drawQueue[j];
                //three.scene.add(extrapcloud);
            }

            geometry.dispose();
            positions.length = 0;
            colors.length = 0;
        }

    }
    //绘制内存中但不在视椎体内的节点
/*
    for(let i = 0; i < drawBeforeQueue.length; i++){

        if(pco.nodes[drawBeforeQueue[i]].isDraw === false){

            pco.nodes[drawBeforeQueue[i]].isDraw = true;
            let size, vs, fs;
            let positions = [];
            let colors = [];
            let geometry = new THREE.BufferGeometry();
            if(gui.LOD === false){
                size = 3.0;
                vs = Shaders["vshader"];
            }
            else{
                size = 3.5;
                vs = Shaders["lod_vshader"];
            }
            if(gui.HQ === false){
                fs = Shaders["low_fshader"];
            }
            else{
                fs = Shaders["high_fshader"];
            }

            let uniforms = {
                size: {
                    type: 'float', value: size
                },
                screenHeight: {
                    type: 'float', value: window.innerHeight
                },
                far: {
                    type: 'float', value: camera.far
                },
                near: {
                    type: 'float', value: camera.near
                }
            };

            let shaderMaterial = new THREE.ShaderMaterial({

                uniforms: uniforms,
                vertexShader: vs,
                fragmentShader: fs,

            });
            shaderMaterial.transparent = false;

            for (let j = 0; j < pco.nodes[drawBeforeQueue[i]].geometry.attributes['position'].count; j++) {

                let px = pco.nodes[drawBeforeQueue[i]].geometry.attributes['position'].array[3 * j];
                let py = pco.nodes[drawBeforeQueue[i]].geometry.attributes['position'].array[3 * j + 1];
                let pz = pco.nodes[drawBeforeQueue[i]].geometry.attributes['position'].array[3 * j + 2];
                let level = pco.nodes[drawBeforeQueue[i]].geometry.attributes['level'].array[j];

                let r = pco.nodes[drawBeforeQueue[i]].geometry.attributes['color'].array[4 * j];
                let g = pco.nodes[drawBeforeQueue[i]].geometry.attributes['color'].array[4 * j + 1];
                let b = pco.nodes[drawBeforeQueue[i]].geometry.attributes['color'].array[4 * j + 2];

                let dx = Math.pow(px - x, 2);
                let dy = Math.pow(pz - y, 2);
                let dz = Math.pow(py - z, 2);
                let dis = Math.sqrt(dx + dy + dz);

                let relDis = gui.maxLevel - dis * level * 2.0 / gui.far * gui.maxLevel;

                if (level < relDis) {
                    let lel = pco.nodes[drawBeforeQueue[i]].geometry.attributes['level'].array[j] - pco.nodes[drawBeforeQueue[i]].level;
                    positions.push(px, py, pz);
                    if (gui.LOD === true) {
                        switch (pco.nodes[drawBeforeQueue[i]].level) {
                            case 0:
                                colors.push(128.0 / 255.0, 0, 128.0 / 255.0, 1);
                                break;
                            case 1:
                                colors.push((128.0 - 128 * lel) / 255.0, 0, (128.0 + 127.0 * lel) / 255.0, 1);
                                break;
                            case 2:
                                colors.push(0, (139.0 * lel) / 255.0, (255 - 116 * lel) / 255.0, 1);
                                break;
                            case 3:
                                colors.push(0, (139 + 116 * lel) / 255.0, (139 - 139 * lel) / 255.0, 1);
                                break;
                            case 4:
                                colors.push(lel, 1, 0, 1);
                                break;
                            case 5:
                                colors.push(1, (255 - 90 * lel) / 255.0, 0, 1.0);
                                break;
                            case 6:
                                colors.push(1, (165 - 165 * lel) / 255.0, 0, 1);
                                break;
                            case 7:
                                colors.push(1, 1, 1, 1);
                                break;
                            case 8:
                                colors.push(0, 0, 0, 1);
                                break;
                        }
                    }
                    else {
                        let relY = py - parseInt(py);
                        if (py > 2) {
                            relY = py - 2;
                            colors.push(1, (165 - 165 * relY) / 255.0, 0, 1);
                        } else if (py > 1.5) {
                            relY = (py - 1.5) * 2;
                            colors.push(1, (255 - 90 * relY) / 255.0, 0, 1.0);
                        } else if (py > 1) {
                            relY = (py - 1) * 2;
                            colors.push(relY, 1, 0, 1);
                        } else if (py > 0.5) {
                            relY = (py - 0.5) * 2;
                            colors.push(0, (139 + 116 * relY) / 255.0, (139 - 139 * relY) / 255.0, 1);
                        } else if (py > 0) {
                            relY = (py - 0) * 2;
                            colors.push(0, (139.0 * relY) / 255.0, (255 - 116 * relY) / 255.0, 1);
                        }
                    }

                }
            }


            let colorAttribute = new THREE.Float32BufferAttribute(colors, 4 );

            geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
            geometry.addAttribute('acolor', colorAttribute);

            let pcloud = new THREE.Points(geometry, shaderMaterial);
            pcloud.name = 'b'+ drawBeforeQueue[i];
            console.log(drawBeforeQueue[i]);
            three.add(pcloud);

        }



    }
 */

}

function assign(node, buffer){

    node.databuffer = buffer;

}

function getLength(pco) {

    let que = new Queue();
    que.enqueue(pco.nodes['r']);
    let num = 0;
    while (que.empty() === false) {
        num ++;
        let node = que.dequeue();
        let children = node.getChildren();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            que.enqueue(child);
        }
    }
    return num;

}

//作用在于遍历整棵树
function testTree(){

    let analysisFlag = 0;
    let que = new Queue();
    que.enqueue(Pco.nodes['r']);
    while (que.empty() === false) {

        let node = que.dequeue();
        if(node.isRendered === true){

            analysisFlag = analysisFlag === navigator.hardwareConcurrency? 0: analysisFlag;
            node.analysisFlag = analysisFlag;
            requestQueue.push(node.name);
            analysisFlag++;
            node.isRendered = false;
        }
        let children = node.getChildren();
        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            que.enqueue(child);
        }
    }

}

//画包围盒
function boxRender(drawQueue){

    for(let i = 0; i < drawQueue.length; i++){

        let dx = Pco.nodes[drawQueue[i]].boundingBox.max.x - Pco.nodes[drawQueue[i]].boundingBox.min.x;
        let dy = Pco.nodes[drawQueue[i]].boundingBox.max.y - Pco.nodes[drawQueue[i]].boundingBox.min.y;
        let dz = Pco.nodes[drawQueue[i]].boundingBox.max.z - Pco.nodes[drawQueue[i]].boundingBox.min.z;

        let minx = Pco.nodes[drawQueue[i]].boundingBox.min.x;
        let miny = Pco.nodes[drawQueue[i]].boundingBox.min.y;
        let minz = Pco.nodes[drawQueue[i]].boundingBox.min.z;

        var p1 = new THREE.Vector3( minx, miny, minz );
        var p2 = new THREE.Vector3( minx + dx, miny, minz );
        var p3 = new THREE.Vector3( minx + dx, miny, minz + dz );
        var p4 = new THREE.Vector3( minx, miny, minz + dz );
        var p5 = new THREE.Vector3( minx, miny + dy, minz );
        var p6 = new THREE.Vector3( minx + dx, miny + dy, minz );
        var p7 = new THREE.Vector3( minx + dx, miny + dy, minz + dz );
        var p8 = new THREE.Vector3( minx, miny + dy, minz + dz );

        var geometry = new THREE.Geometry();
        geometry.vertices.push(p1);geometry.vertices.push(p2);
        geometry.vertices.push(p3);geometry.vertices.push(p4);
        geometry.vertices.push(p1);geometry.vertices.push(p5);
        geometry.vertices.push(p8);geometry.vertices.push(p4);
        geometry.vertices.push(p3);geometry.vertices.push(p7);
        geometry.vertices.push(p8);geometry.vertices.push(p5);
        geometry.vertices.push(p6);geometry.vertices.push(p7);
        geometry.vertices.push(p3);geometry.vertices.push(p2);
        geometry.vertices.push(p6);

        var lineMaterial = new THREE.LineBasicMaterial({
            color: 0x000000,
        });

        var line = new THREE.Line(geometry, lineMaterial);
        three.scene.add(line);

        var cubeGeo = new THREE.CubeGeometry(dx, dz, dy);
        var cubeMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true

        });

        //var cube = new THREE.Mesh(cubeGeo, cubeMat);

        //cube.position.x = Pco.nodes[drawQueue[i]].boundingBox.min.x + dx/2.0;
        //cube.position.y = Pco.nodes[drawQueue[i]].boundingBox.min.z + dz/2.0;
        //cube.position.z = Pco.nodes[drawQueue[i]].boundingBox.min.y + dy/2.0;

        //let cubeEdges = new THREE.EdgesGeometry(cubeGeo, 1);
        //let edgesMtl =  new THREE.LineBasicMaterial({color: 0xffffff});
        //let cubeLine = new THREE.LineSegments(cubeEdges, edgesMtl);
        //cube.add(cubeLine);

        //three.scene.add(cube);
    }
}

//线程池
class WorkerPool{

    constructor(){

        this.maximumThreadsNumber = window.navigator.hardwareConcurrency;
        console.log('所使用的CPU为:', this.maximumThreadsNumber, '核');
        this.workers = {};
    }

    init(url){

        this.workers[url] = [];
        for (let i = 0; i < this.maximumThreadsNumber; i++){

            let worker = new Worker(url);
            worker.name = '解析线程' + i;
            this.workers[url].push(worker);

        }
    }

    getWorker(url){

        if (!this.workers[url]){
            this.workers[url] = [];
        }

        if (this.workers[url].length === 0){
            let worker = new Worker(url);
            this.workers[url].push(worker);
        }

        let worker = this.workers[url].pop();

        return worker;
    }

    getCorrespondingThread(url, i){

        if( i === 88){

            return this.workers[url][0];
        }
        if (!this.workers[url]){

            this.workers[url] = [];
        }

        if (this.workers[url][i] === undefined){

            this.workers[url][i] = new Worker(url);
            this.workers[url][i].name = '解析线程' + i;
        }

        return this.workers[url][i];
    }
    returnWorker(url, worker){

        this.workers[url].push(worker);
    }
}

function removeModel1(){

    var number = 0;
    for (let i = 0; i < drawQueue.length; i++) {

        if (Pco.nodes[drawQueue[i]].level > three.mustRenderLevel) {

            Pco.nodes[drawQueue[i]].isDraw = false;

        }
        else{

            number++;
            //console.log(drawQueue[i], Pco.nodes[drawQueue[i]].isDraw);
        }

    }
    //0,1,2由于只绘制一次所以大小没变
    console.log(number);
    if(gui.LOD === false) {

        for (let i = 0; i < three.scene.children.length; i++) {

            if (three.scene.children[i].name[0] !== 'n') {

                three.scene.children[i].visible = false;
                three.scene.children[i].geometry.dispose();
                three.scene.children[i].material.dispose();
                three.scene.remove(three.scene.children[i]);

            }

        }

    }
    else{

        while(three.scene.children.length > 0) {
            for (let i = 0; i < three.scene.children.length; i++) {

                if(three.scene.children[i].name != null) {

                    three.scene.children[i].visible = false;
                    three.scene.children[i].geometry.dispose();
                    three.scene.children[i].material.dispose();
                    three.scene.remove(three.scene.children[i]);

                }
            }
        }

        for(let i = 0;i < drawQueue.length; i++){

            Pco.nodes[drawQueue[i]].isDraw = false;

        }
    }


}

function removeRenderedData(){

    if(flag.changecamera === 1 && three.scene != null) {

        for (let i = 0; i < three.scene.children.length;) {

            if(drawQueue.indexOf(three.scene.children[i].name) === -1){

                three.scene.children[i].geometry.dispose();
                three.scene.children[i].material.dispose();
                three.scene.remove(three.scene.children[i]);
            }
            else{

                i++;
            }
        }
    }

}

function removeModel(){

    let frustumplanes = [];
    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));

    for(let i = 0; i < 6; i++){

        frustumplanes.push(frustum.planes[i].normal.x);
        frustumplanes.push(frustum.planes[i].normal.y);
        frustumplanes.push(frustum.planes[i].normal.z);
        frustumplanes.push(frustum.planes[i].constant);

    }

    if(flag.changecamera === 1 && three.scene != null) {

        for (let i = 0; i < three.scene.children.length;) {

            if (three.scene.children[i].name.length > three.mustRenderLevel + 1) {

                three.scene.children[i].geometry.dispose();
                three.scene.children[i].material.dispose();
                three.scene.remove(three.scene.children[i]);

            }
            else{
                three.scene.children[i].material.uniforms.frustumPlanes = {
                    type: 'vec4', value: frustumplanes
                };
                i++;
            }
        }
    }

}

function removeALLModel(){
    let o = [];
    if(flag.changecamera === 1 && three.scene != null) {

        for (let i = 0; i < three.scene.children.length;) {

            three.scene.children[i].isOld = true;
            o.push(three.scene.children[i].name);
            three.scene.children[i].geometry.dispose();
            three.scene.children[i].material.dispose();
            three.scene.remove(three.scene.children[i]);

        }
    }
    console.log(o);
}

function removeOldPoints(){

    var n = 0;
    if(flag.changecamera === 1 && three.scene != null) {

        for (let i = 0; i < three.scene.children.length;) {

            if(three.scene.children[i].isOld === true){

                n++;
                three.scene.children[i].geometry.dispose();
                three.scene.children[i].material.dispose();
                three.scene.remove(three.scene.children[i]);
            }
            else{
                i++;
            }
        }
    }
    console.log('需要舍弃的旧点有',n);
}

function judgeOldPoints(){


    if(flag.changecamera === 1 && three.scene != null) {

        for (let i = 0; i < three.scene.children.length; i++) {

            three.scene.children[i].isOld = true;
        }
    }
    console.log('之前有节点', three.scene.children.length);
}

function origin(name, level, x, y, z) {

    let road = 'r';
    let depth = 0;
    let point = new THREE.Vector3(
        Pco.nodes['r'].boundingSphere.center.x,
        Pco.nodes['r'].boundingSphere.center.y,
        Pco.nodes['r'].boundingSphere.center.z,
    );
    while(depth < level){

        if(x <= point.x){
            if(y <= point.y){
                if( z <= point.z){
                    road = road + '0';
                }
                else{
                    road = road + '1';
                }
            }
            else{
                if( z <= point.z){
                    road = road + '2';
                }
                else{
                    road = road + '3';
                }
            }
        }
        else{
            if(y <= point.y){
                if( z <= point.z){
                    road = road + '4';
                }
                else{
                    road = road + '5';
                }
            }
            else{
                if( z <= point.z){
                    road = road + '6';
                }
                else{
                    road = road + '7';
                }
            }
        }
        depth ++;
        point.x = Pco.nodes[road].boundingSphere.center.x;
        point.y = Pco.nodes[road].boundingSphere.center.y;
        point.z = Pco.nodes[road].boundingSphere.center.z;
    }

}
//在GPU中做判断
function GPU_CLOD_Render(nodeName) {

    flag.completedRenderNodeNumber ++;

    if(flag.completedRenderNodeNumber === drawNewNodesQueue.length){

        ttt && clearInterval(ttt);

    }

    var frustrmPlanes = [];
    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));
    for(let i = 0; i < 6; i++){

        frustrmPlanes.push(frustum.planes[i].normal.x);
        frustrmPlanes.push(frustum.planes[i].normal.y);
        frustrmPlanes.push(frustum.planes[i].normal.z);
        frustrmPlanes.push(frustum.planes[i].constant);

    }

    if (memoryNode.indexOf(nodeName) === -1) {

        memoryNode.push(nodeName);
    }

    let size, vs, fs;

    let geometry = new THREE.BufferGeometry();

    {
        size = 3.0;
        vs = Shaders["vshaders"];

        if (gui.HQ === false) {

            fs = Shaders["low_fshader"];

        } else {
            fs = Shaders["high_fshader"];
        }
    }

    let uniforms = {

        size: {
            type: 'float', value: size
        },
        screenHeight: {
            type: 'float', value: window.innerHeight
        },
        far: {
            type: 'float', value: three.camera.far
        },
        near: {
            type: 'float', value: three.camera.near
        },
        maxLevel: {
            type: 'float', value: gui.maxLevel
        },
        frustumPlanes: {
            type: 'vec4', value: frustrmPlanes
        },
    };

    let shaderMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,

    });
    shaderMaterial.transparent = false;
    shaderMaterial.side = THREE.DoubleSide;
/*
    var positions = Pco.nodes[nodeName].geometry.attributes['position'].array.map(function(num) {
        return num * 1;
    });

    var levels = Pco.nodes[nodeName].geometry.attributes['level'].array.map(function(num) {
        return num * 1;
    });
*/
    var positions = [].concat(Pco.nodes[nodeName].geometry.attributes['position'].array);
    var levels = [].concat(Pco.nodes[nodeName].geometry.attributes['level'].array);

    geometry.addAttribute('position', new THREE.BufferAttribute(positions[0], 3));
    geometry.addAttribute('level', new THREE.BufferAttribute(levels[0], 1));

    let pcloud = new THREE.Points(geometry, shaderMaterial);
    pcloud.name = nodeName;
    flag.pointsNum = flag.pointsNum + levels[0].length;
    document.getElementById("pointsNum").value = '总点数:' + flag.pointsNum;
    three.scene.add(pcloud);

}
//在CPU中做判断
function CLOD_Render(nodeName) {

    //console.time('x' + nodeName);
    flag.completedRenderNodeNumber ++;

    if(flag.completedRenderNodeNumber === drawQueue.length){

        ttt && clearInterval(ttt);
        //transferNodeFromMemoryToDatabase();
    }

    let x = three.camera.position.x;
    let y = three.camera.position.y;
    let z = three.camera.position.z;

    let frustumPlanes = [];
    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));

    for(let i = 0; i < 6; i++){

        frustumPlanes.push(frustum.planes[i].normal.x);
        frustumPlanes.push(frustum.planes[i].normal.y);
        frustumPlanes.push(frustum.planes[i].normal.z);
        frustumPlanes.push(frustum.planes[i].constant);

    }

    if (memoryNode.indexOf(nodeName) === -1) {

        memoryNode.push(nodeName);
    }
    else{}

    let vs, fs;
    let positions = [];
    let geometry = new THREE.BufferGeometry();

    {
        vs = Shaders["DLOD_vshader"];

        if (gui.HQ === false) {

            fs = Shaders["low_fshader"];

        } else {
            fs = Shaders["high_fshader"];
        }
    }


    let uniforms = {

        screenHeight: {
            type: 'float', value: window.innerHeight
        },
        far: {
            type: 'float', value: three.camera.far
        },
        near: {
            type: 'float', value: three.camera.near
        },
        maxLevel:{
            type: 'float', value: gui.maxLevel
        },
        level:{
            type: 'float', value: Pco.nodes[nodeName].level
        },
        frustumPlanes: {
            type: 'vec4', value: frustumPlanes
        },
    };

    let shaderMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,

    });
    shaderMaterial.transparent = false;
    shaderMaterial.side = THREE.FrontSide;
    shaderMaterial.blending = THREE.NormalBlending;
    shaderMaterial.depthFunc = THREE.LessDepth;
    shaderMaterial.depthWrite = true;

    for (let i = 0; i < Pco.nodes[nodeName].geometry.attributes['position'].count; i++) {

        let px = Pco.nodes[nodeName].geometry.attributes['position'].array[3 * i];
        let py = Pco.nodes[nodeName].geometry.attributes['position'].array[3 * i + 1];
        let pz = Pco.nodes[nodeName].geometry.attributes['position'].array[3 * i + 2];
        let level = Pco.nodes[nodeName].geometry.attributes['level'].array[i];
        let isInFrustum = frustum.containsPoint(new THREE.Vector3(px, py, pz));
        if (isInFrustum || level <= three.mustRenderLevel+1) {

            //let r = Pco.nodes[nodeName].geometry.attributes['color'].array[4 * i];
            //let g = Pco.nodes[nodeName].geometry.attributes['color'].array[4 * i + 1];
            //let b = Pco.nodes[nodeName].geometry.attributes['color'].array[4 * i + 2];

            let dx = Math.pow(px - x, 2);
            let dy = Math.pow(py - y, 2);
            let dz = Math.pow(pz - z, 2);

            let dis = Math.sqrt(dx + dy + dz);
            let relDis = clodJudge(dis, level);

            if (level < relDis || level <= 3) {

                positions.push(px, py, pz);

            }
        }

    }

    geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    Pco.nodes[nodeName].renderRate = positions.length/3/Pco.nodes[nodeName].geometry.attributes['position'].count;
    //console.log(nodeName, Pco.nodes[nodeName].renderRate);
    let pcloud = new THREE.Points(geometry, shaderMaterial);
    pcloud.name = nodeName;

    three.scene.add(pcloud);
    geometry.dispose();

    flag.dbpointsNum = flag.dbpointsNum + Pco.nodes[nodeName].geometry.attributes['position'].count;
    flag.pointsNum = flag.pointsNum + positions.length/3;

    if(positions.length === 0){
        flag.liyonglv++;
    }

    //console.log(nodeName,positions.length/3/Pco.nodes[nodeName].geometry.attributes['position'].count);
    //console.log(flag.liyonglv,flag.dbpointsNum, flag.pointsNum, flag.pointsNum/flag.dbpointsNum);
    document.getElementById("pointsNum").value = '总点数:' + flag.pointsNum;
    //console.timeEnd('x' + nodeName);
}

function DLOD_Render(nodeName) {

    flag.completedRenderNodeNumber ++;

    if(flag.completedRenderNodeNumber === drawQueue.length){

        ttt && clearInterval(ttt);
    }

    let x = three.camera.position.x;
    let y = three.camera.position.y;
    let z = three.camera.position.z;
    var eyePosition = new Float32Array(3);
    eyePosition[0] = x;
    eyePosition[1] = y;
    eyePosition[2] = z;

    var levelColor = new Float32Array(4);
    switch (Pco.nodes[nodeName].level) {
        case 0:levelColor = [1.0, 0.0, 0.0, 1.0];break;
            case 1:levelColor = [0.0, 1.0, 0.0, 1.0];break;
                case 2:levelColor = [0.0, 0.0, 1.0, 1.0];break;
                    case 3:levelColor = [1.0, 0.0, 0.0, 1.0];break;
                        case 4:levelColor = [1.0, 0.0, 0.0, 1.0];break;
                            case 5:levelColor = [1.0, 0.0, 0.0, 1.0];break;
                                case 6:levelColor = [1.0, 0.0, 0.0, 1.0];break;
                                    case 7:levelColor = [1.0, 0.0, 0.0, 1.0];break;
                                        default:levelColor = [1.0, 0.0, 0.0, 1.0];break;
    }

    let frustum = new THREE.Frustum();
    frustum.setFromMatrix(new THREE.Matrix4().multiplyMatrices(three.camera.projectionMatrix, three.camera.matrixWorldInverse));

    if (memoryNode.indexOf(nodeName) === -1) {

        memoryNode.push(nodeName);
    }
    else{}

    let size, vs, fs;

    {
        size = 3.0;
        vs = Shaders["DLOD_vshader"];

        if (gui.HQ === false) {

            fs = Shaders["low_fshader"];

        } else {
            fs = Shaders["high_fshader"];
        }
    }

    let uniforms = {

        level:{
            type: 'vec4', value: levelColor
        },
        size: {
            type: 'float', value: size
        },
        screenHeight: {
            type: 'float', value: window.innerHeight
        },
        far: {
            type: 'float', value: three.camera.far
        },
        near: {
            type: 'float', value: three.camera.near
        },
        eyePosition: {
            type: 'vec3', value: eyePosition
        },
    };

    let shaderMaterial = new THREE.ShaderMaterial({

        uniforms: uniforms,
        vertexShader: vs,
        fragmentShader: fs,

    });
    shaderMaterial.transparent = false;
    shaderMaterial.side = THREE.FrontSide;
    shaderMaterial.blending = THREE.NormalBlending;
    shaderMaterial.depthFunc = THREE.LessDepth;
    shaderMaterial.depthWrite = true;

    Pco.nodes[nodeName].renderRate = 1.0;

    let pcloud = new THREE.Points(Pco.nodes[nodeName].geometry, shaderMaterial);
    pcloud.name = nodeName;
    three.scene.add(pcloud);

    flag.dbpointsNum = flag.dbpointsNum + Pco.nodes[nodeName].geometry.attributes['position'].count;
    flag.pointsNum = flag.dbpointsNum;

    document.getElementById("pointsNum").value = '总点数:' + flag.pointsNum;
}
