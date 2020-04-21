
var DBdata;
function initIndexedDB(){

    var wrequest = indexedDB.open("customdata26T3", 1);

    wrequest.onerror = () => {

        console.log('数据库打开报错');
    };

    wrequest.onsuccess = (ev) => {

        DBdata = ev.target.result;
        console.log('Hello,数据库打开成功');

    };

    wrequest.onupgradeneeded = (ev) => {

        DBdata = ev.target.result;
        console.log('customdata26T1数据库新建成功');
        if (!DBdata.objectStoreNames.contains('Nodes')) {
            DBdata.createObjectStore('Nodes',{keyPath:"name"});
        }
    };
}

function addToIndexedDB(nodesName, nodesPositionArray, levelArray) {

    for(let i = 0; i < nodesName.length; i++){

        let request = DBdata.transaction(['Nodes'], 'readwrite').objectStore('Nodes').add({

            name: nodesName[i],
            positionArray: nodesPositionArray[i],
            levelArray: levelArray[i],
        });

        request.onsuccess = function (event) {

            if(i === nodesName.length - 1){

                let backMessage = {
                    nodesName:nodesName
                };
                postMessage(backMessage);
            }
            //console.log(i, nodesName[i], '数据插入成功');
        };

        request.onerror = function (event) {

            if(i === nodesName.length - 1){

                let backMessage = {
                    nodesName:nodesName
                };
                postMessage(backMessage);
            }
            else{
                //console.log(i, nodesName[i],'数据插入失败',event);
            }


        };
    }
}

onmessage = function (message){

    var flag = message.data.flag;

    if(flag === 0){
        initIndexedDB();
        postMessage('DONE');
    }
    if(flag === 1){

        let nodesName = message.data.nodesName;
        let nodesPositionArray = message.data.nodesPositionArray;
        let nodesLevelArray = message.data.nodesLevelArray;
        addToIndexedDB(nodesName, nodesPositionArray, nodesLevelArray);
        /*
        let backMessage = {
            nodesName:nodesName
        };
        postMessage(backMessage);

         */
    }

};