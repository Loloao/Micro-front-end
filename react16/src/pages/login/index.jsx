import React, {useCallback, useState} from 'react'
import axios from 'axios'

const Login  = () => {
    const [account, setAccount] = useState('')
    const [password, setPassword] = useState('')

    const changeAccount = useCallback((e) => {
        console.log(e)
        setAccount(e.target.value)
    }, [])

    const changePassword = useCallback((e) => {
        console.log(e)
        setPassword(e.target.value)
    }, [])

    const login = useCallback(() => {
        axios.post('http://localhost:3000/react16/login').then(res => {
            console.log('登录成功')
        })
    }, [])

    return <div>
        账号：<input 
            type='text' 
            placeholder='请输入账号' 
            value={account} 
            onChange={changeAccount}
        />
        密码：<input 
            type='password' 
            placeholder='请输入密码' 
            value={password}
            onChange={changePassword}
        />
        <button onClick={login}>确定</button>
    </div>
}

export default Login