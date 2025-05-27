import React from "react";

export default function List({msg}) {
    let listItem = <tr><th colSpan={6}> 쪽지가 없습니다.</th></tr>

    if(msg.list.length > 0){
        listItem = msg.list.map(item => {

        })
    }
    return (
        <>
        {listItem}
        </>
    );
}