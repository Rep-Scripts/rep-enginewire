local p = nil

local function MiniGame()
    p = promise.new()
    SendNuiMessage({
        action = 'startGame',
    })
    SetNuiFocus(true, true)
    local result = Citizen.Await(p)
    return result
end

exports("MiniGame", MiniGame)

RegisterCommand('testminigame', function ()
    local r = MiniGame()
    print(r)
end,false)

RegisterNUICallback('finish', function(data)
    p:resolve(data.result)
    p = nil
    SetNuiFocus(false, false)
end)