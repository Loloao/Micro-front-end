import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from '../pages/login'
import NewCar from '../pages/newCar'
import Rank from '../pages/rank'

const BasicMap = () => {
    return <Routes>
        <Route path='login' element={<Login />} />
        <Route path='newCar' element={<NewCar />} />
        <Route path='rank' element={<Rank />} />
    </Routes>
}

export default BasicMap