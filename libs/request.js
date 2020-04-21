var XMLHttp =
    {
        //定义第一个属性，该属性用于缓存XMLHttpRequest对象的数组
        XMLHttpRequestPool: [],
        //对象的第一个方法，该方法用于返回一个XMLHttpRequest对象
        getOne:function(){
            for (var i = 0; i < 6; i ++)
            {
                if(this.XMLHttpRequestPool[i] == null){

                    this.XMLHttpRequestPool[i] = this.createXMLHttpRequest();
                    this.XMLHttpRequestPool[i].name = 'xmlHttpRequest' + i;

                }
                if (this.XMLHttpRequestPool[i].readyState === 0 || this.XMLHttpRequestPool[i].readyState === 4)
                {
                    return this.XMLHttpRequestPool[i];
                }
            }
            return null;
        },
        getInstance:function()
        {
            // 从XMLHttpRequest对象池中取出一个空闲的XMLHttpRequest
            for (var i = 0; i < this.XMLHttpRequestPool.length; i ++)
            {
                //如果XMLHttpReuqest的readyState为0，或者为4，
                //都表示当前的XMLHttpRequest对象为闲置的对象
                if (this.XMLHttpRequestPool[i].readyState === 0 || this.XMLHttpRequestPool[i].readyState === 4)
                {
                    return this.XMLHttpRequestPool[i];
                }
            }
            //如果没有空闲的，将再次创建一个新的XMLHttpRequest对象
            this.XMLHttpRequestPool[this.XMLHttpRequestPool.length] = this.createXMLHttpRequest();
            //返回刚刚创建的XMLHttpRequest对象
            return this.XMLHttpRequestPool[this.XMLHttpRequestPool.length - 1];
        },
    //创建新的XMLHttpRequest对象
    createXMLHttpRequest:function()
    {
        //对于DOM 2 规范的浏览器
        if (window.XMLHttpRequest)
        {
            var objXMLHttp = new XMLHttpRequest();
        }
        //对于Internet Explorer浏览器
        else
        {
            //将Internet Explorer内置的所有XMLHTTP ActiveX控制设置成数组
            var MSXML = ['MSXML2.XMLHTTP.5.0', 'MSXML2.XMLHTTP.4.0', 'MSXML2.XMLHTTP.3.0', 'MSXML2.XMLHTTP', 'Microsoft.XMLHTTP'];
            //依次对Internet Explorer内置的XMLHTTP控件初始化，尝试创建XMLHttpRequest对象
            for(var n = 0; n < MSXML.length; n ++)
            {
                try
                {
                    //如果可以正常创建XMLHttpRequest对象，使用break跳出循环
                    var objXMLHttp = new ActiveXObject(MSXML[n]);
                    break;
                }
                catch(e)
                {
                }
            }
        }
        //Mozilla某些版本没有readyState属性
        if (objXMLHttp.readyState == null)
        {
            //直接设置其readyState为0
            objXMLHttp.readyState = 0;
            //对于哪些没有readyState属性的浏览器，将load动作与下面的函数关联起来
            objXMLHttp.addEventListener("load", function ()
            {
                //当从服务器加载数据完成后，将readyState状态设为4
                objXMLHttp.readyState = 4;
                if (typeof objXMLHttp.onreadystatechange == "function")
                {
                    objXMLHttp.onreadystatechange();
                }
            }, false);
        }
        return objXMLHttp;
    },

    //定义对象的第三个方法： 发送请求(方法[POST,GET], 地址, 数据, 回调函数)
    sendRequest: function (method, url, data, nodename, callback)
    {
        var objXMLHttp = this.getOne();
        if(objXMLHttp == null){

            requestQueue.push(nodename);
            return;
        }

        with(objXMLHttp)
        {
            try
            {
                //增加一个额外的randnum请求参数，用于防止IE缓存服务器响应
                //if (url.indexOf("?") > 0)
                //{
                //    url += "&randnum=" + Math.random();
                //}
                //else
                //{
                //    url += "?randnum=" + Math.random();
                //}
                //打开与服务器的连接
                open(method, url, true);
                objXMLHttp.responseType = 'arraybuffer';
                //对于使用POST请求方式
                if (method === "POST")
                {

                }
                //对于采用GET请求
                if (method === "GET")
                {
                    send(null);
                }
                //设置状态改变的回调函数
                onreadystatechange = function ()
                {
                    //当服务器的相应完成时，以及获得了正常的服务器响应
                    if (objXMLHttp.readyState === 4 && (objXMLHttp.status === 200 || objXMLHttp.status === 304))
                    {
                        //当响应时机成熟时，调用回调函数处理响应
                        if(objXMLHttp.response != null && objXMLHttp.response !== ""){

                            flag.webNum++;

                            if(flag.webNum === flag.dbpointsNum){

                                after = new Date().getTime();
                                console.log(flag.webNum, after-before);

                            }
                            //var response = objXMLHttp.response;

                            callback();
                            /*
                            let workerPath = 'libs/readBin.js';
                            let worker = workerPool.getWorker(workerPath);
                            worker.postMessage({
                                nodeName: nodename,
                                buffer: response,
                                scale: Pco.scale[0],
                                boxX: Pco.nodes[nodename].boundingBox.min.x,
                                boxY: Pco.nodes[nodename].boundingBox.min.y,
                                boxZ: Pco.nodes[nodename].boundingBox.min.z,
                                level: Pco.nodes[nodename].level,
                                tightBoxX: Pco.tightBoundingBox.max.x,
                                tightBoxY: Pco.tightBoundingBox.max.y,
                                tightBoxZ: Pco.tightBoundingBox.max.Z,
                            });
                            worker.onmessage = function (message) {
                                workerPool.returnWorker(workerPath, worker);
                                let geometry = new THREE.BufferGeometry();
                                let positionArray = message.data.positionArray;
                                let colorArray = message.data.colorArray;
                                let levelArray = message.data.levelArray;

                                let positionBuffer = new THREE.BufferAttribute(new Float32Array(positionArray), 3);
                                let levelBuffer = new THREE.BufferAttribute(new Float32Array(levelArray), 1);
                                let colorBuffer = new THREE.BufferAttribute(colorArray, 4);

                                geometry.addAttribute('position', positionBuffer);
                                geometry.addAttribute('level', levelBuffer);
                                geometry.addAttribute('color', colorBuffer);

                                Pco.nodes[nodename].geometry = geometry;
                                choosePoints(nodename);
                            };

                             */
                        }

                    }
                }
            }
            catch(e)
            {
                alert(e);
            }
        }
    }
};