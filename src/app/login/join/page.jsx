"use client"

import "../login.css"
import {useRef, useState} from "react";
import axios from "axios";
import { useRouter } from 'next/navigation';

export default function joinPage(){
    const router = useRouter();
    const[info,setInfo]=useState({id:'',pw:'',name:'',year:'',gender:'',email:''});
    let chk = useRef(false);

    const input=(e)=>{
        let {name,value} = e.target;
        setInfo({...info, [name]:value});
    };

    const overlay=async (e) => {
        if(info.id == ''){
            alert('아이디를 입력 하세요');
        }else {
            let {data} = await axios.get('http://localhost/overlay/'+info.id);
            if(data.use){
                alert(`${info.id} 는 사용 가능한 아이디 입니다.`);
                chk.current = true;
            }else{
                alert(`${info.id} 는 사용중인 아이디 입니다.`);
                setInfo({...info, id:''});
            }
        }
    }

    const handleJoin = async () => {
        // 필수 입력값 체크
        if (!info.id || !info.pw || !info.name || !info.year || !info.gender || !info.email) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 아이디 중복체크 확인
        if (!chk.current) {
            alert('아이디 중복체크를 해주세요.');
            return;
        }

        try {
            const response = await axios.post('http://localhost/join', info);
            if (response.data.success) {
                alert('회원가입이 완료되었습니다.');
                router.push('/login'); // 로그인 페이지로 이동
            } else {
                alert('회원가입에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('회원가입 에러:', error);
            alert('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="login">
            <table>
                <tbody>
                <tr>
                    <th>ID</th>
                    <td>
                        <input type="text" name="id" value={info.id} onChange={input}/>
                        <button type="button" id="overlay" onClick={overlay}>중복체크</button>
                        <p id="result"></p>
                    </td>
                </tr>
                <tr>
                    <th>PW</th>
                    <td>
                        <input type="password" name="pw" value={info.pw} onChange={input}/>
                    </td>
                </tr>
                <tr>
                    <th>NAME</th>
                    <td>
                        <input type="text" name="name" value={info.name} onChange={input}/>
                    </td>
                </tr>
                <tr>
                    <th>YEAR</th>
                    <td>
                        <input type="text" name="year" value={info.year} onChange={input}/>
                    </td>
                </tr>
                <tr>
                    <th>GENDER</th>
                    <td>
                        <input type="radio" name="gender" value="남" onChange={input}/> 남
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="radio" name="gender" value="여" onChange={input}/> 여
                    </td>
                </tr>
                <tr>
                    <th>EMAIL</th>
                    <td>
                        <input type="text" name="email" value={info.email} onChange={input}/>
                    </td>
                </tr>
                <tr>
                    <th colSpan="2">
                        <input type="button" value="회원가입" onClick={handleJoin}/>
                    </th>
                </tr>
                </tbody>
            </table>
        </div>
    )
}