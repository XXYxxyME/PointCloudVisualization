
//读取hrc索引文件
class hrcLoader {
    //构造函数
    constructor() {

    }
    static loadJSON(){

        let mJson = $.ajax({url:jsonurl, async:false});
        //解析json
        let json = JSON.parse(mJson.responseText);

        //整棵树
        let pco = new pointCloudOctreeGeometry();
        //pco.spacing = json.spacing;
        pco.spacing = 10.0;
        pco.hierarchyStepSize = json.hierarchyStepSize;
        pco.pointAttributes = json.pointAttributes;
        pco.scale = json.scale;

        let min = new THREE.Vector3(json.boundingBox.lx, json.boundingBox.ly, json.boundingBox.lz);
        minx = json.boundingBox.lx;
        miny = json.boundingBox.ly;
        minz = json.boundingBox.lz;
        let max = new THREE.Vector3(json.boundingBox.ux, json.boundingBox.uy, json.boundingBox.uz);
        let boundingBox = new THREE.Box3(min, max);
        let tightBoundingBox = boundingBox.clone();

        if (json.tightBoundingBox) {
            tightBoundingBox.min.copy(new THREE.Vector3(json.tightBoundingBox.lx, json.tightBoundingBox.ly, json.tightBoundingBox.lz));
            tightBoundingBox.max.copy(new THREE.Vector3(json.tightBoundingBox.ux, json.tightBoundingBox.uy, json.tightBoundingBox.uz));
        }

        let offset = min.clone();

        boundingBox.min.sub(offset);
        boundingBox.max.sub(offset);

        boundingBox.max.x = boundingBox.max.x/10;
        boundingBox.max.y = boundingBox.max.y/10;
        boundingBox.max.z = boundingBox.max.z/10;

        tightBoundingBox.min.sub(offset);
        tightBoundingBox.max.sub(offset);

        pco.projection = json.projection;
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

        return pco;

    }


    //读取非自建hrc二进制文件
    static loadHierachyFromPotree(nodeName){
        try {
            let url;
            if(nodeName.length >= 6){
                let length = nodeName.length;
                let number = nodeName.substring(1, length);
                url = hrcurl + number + '/' + nodeName + '.hrc';
            }
            else{
                url = hrcurl + nodeName + '.hrc';
            }

            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        let hbuffer = xhr.response;
                        if( hbuffer == null)
                        {
                            return;
                        }
                        callback(nodeName, hbuffer);

                    } else {
                        console.log('Failed to load hrcFile!');
                    }
                }
            };

            xhr.send(null);

        }catch (e) {
            console.log(e);
        }

        //回调函数，提取二进制文件内容，并由此建立外部树
        let callback = function (nodeName, hbuffer) {

            let view = new DataView(hbuffer);
            let stack = [];
            let children = view.getUint8(0);
            let numPoints = view.getUint32(1, true);

            Pco.nodes[nodeName].numPoints = numPoints;
            stack.push({children: children, numPoints: numPoints, name: nodeName});
            let decoded = [];
            let offset = 5;
            while (stack.length > 0) {
                let node = stack.shift();
                let mask = 1;
                for (let i = 0; i < 8; i++) {
                    if ((node.children & mask) !== 0) {
                        let childName = node.name + i;
                        let childChildren = view.getUint8(offset);
                        let childNumPoints = view.getUint32(offset + 1, true);
                        stack.push({children: childChildren, numPoints: childNumPoints, name: childName});
                        decoded.push({children: childChildren, numPoints: childNumPoints, name: childName});
                        offset += 5;
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
                let decodedNumPoints = decoded[i].numPoints;
                let index = parseInt(name.charAt(name.length - 1));
                let parentName = name.substring(0, name.length - 1);
                let parentNode = Pco.nodes[parentName];
                let level = name.length - 1;

                let boundingBox = Utils.createChildAABB(parentNode.boundingBox, index);
                let currentNode = new pointCloudTreeNode(name, boundingBox);
                currentNode.level = level;
                currentNode.numPoints = decodedNumPoints;
                currentNode.hasChildren = decoded[i].children > 0;
                currentNode.spacing = Pco.spacing / Math.pow(2, level);
                parentNode.addChild(currentNode);
                Pco.nodes[name] = currentNode;

            }
        }
    }
    //自建的hrc文件
    static loadHierachyFromSelf(nodeName) {
        try {
            //let url = hrcurl + nodeName;
            let url = hrcurl;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200 || xhr.status === 0) {
                        let hbuffer = xhr.response;
                        if (hbuffer == null) {
                            return;
                        }
                        callback(nodeName, hbuffer);

                    } else {
                        console.log('Failed to load hrcFile!');
                    }
                }
            };

            xhr.send(null);

        } catch (e) {
            console.log(e);
        }

        //回调函数，提取二进制文件内容，并由此建立外部树
        let callback = function (nodeName, hbuffer) {

            let view = new DataView(hbuffer);
            let stack = [];
            let children = view.getUint8(0);

            stack.push({children: children,  name: nodeName});
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
            judegeVisibleNodes();
            judgeWhere();
        }
    }

}
