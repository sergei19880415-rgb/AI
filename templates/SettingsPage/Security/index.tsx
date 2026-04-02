import { useState } from "react";
import Switch from "@/components/Switch";
import Button from "@/components/Button";
import TabContainer from "../TabContainer";
import Line from "../Line";

const Security = ({}) => {
    const [twoFactorAuthentication, setTwoFactorAuthentication] =
        useState(false);
    const [loginAlerts, setLoginAlerts] = useState(false);

    return (
        <TabContainer title="Безопасность">
            <Line
                title="Двухфакторная аутентификация (2FA)"
                description="Дополнительный уровень защиты при входе в аккаунт."
            >
                <Switch
                    checked={twoFactorAuthentication}
                    onChange={setTwoFactorAuthentication}
                />
            </Line>
            <Line
                title="Уведомления о входе"
                description="Сообщать о входе с нового устройства или браузера."
            >
                <Switch checked={loginAlerts} onChange={setLoginAlerts} />
            </Line>
            <Line
                title="Активные сессии"
                description="Управление сессиями появится в ближайших обновлениях."
            >
                <Button className="!text-[1rem]" isSecondary isSmall disabled>
                    Скоро
                </Button>
            </Line>
            <Line
                title="Выйти со всех устройств"
                description="Функция будет доступна в одном из следующих релизов."
            >
                <Button
                    className="!text-[1rem] !shadow-[inset_0_0_0_0.0625rem_#D73E3D] !text-error-100 hover:!bg-error-100 hover:!text-gray-0"
                    isSecondary
                    isSmall
                    disabled
                >
                    Скоро
                </Button>
            </Line>
        </TabContainer>
    );
};

export default Security;
