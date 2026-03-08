import { useState } from "react";
import Switch from "@/components/Switch";
import Select from "@/components/Select";
import Button from "@/components/Button";
import { SelectOption } from "@/types/select";
import TabContainer from "../TabContainer";
import Line from "../Line";

const dataPrivacyOptions = [
    { id: 0, name: "Standard" },
    { id: 1, name: "Strict" },
];

const Security = ({}) => {
    const [twoFactorAuthentication, setTwoFactorAuthentication] =
        useState(false);
    const [loginAlerts, setLoginAlerts] = useState(false);
    const [dataPrivacy, setDataPrivacy] = useState<SelectOption | null>(
        dataPrivacyOptions[0]
    );

    return (
        <TabContainer title="Security">
            <Line
                title="Two-Factor Authentication (2FA)"
                description="Add an extra layer of protection when logging in to your account."
            >
                <Switch
                    checked={twoFactorAuthentication}
                    onChange={setTwoFactorAuthentication}
                />
            </Line>
            <Line
                title="Login Alerts"
                description="Receive an alert whenever a new login occurs on a different device or browser."
            >
                <Switch checked={loginAlerts} onChange={setLoginAlerts} />
            </Line>
            <Line
                title="Data Privacy"
                description="Control how Zyra stores and uses your interaction data."
            >
                <Select
                    value={dataPrivacy}
                    onChange={setDataPrivacy}
                    options={dataPrivacyOptions}
                />
            </Line>
            <Line
                title="Active Sessions"
                description="Check and end other active sessions to maintain account control."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    View Session
                </Button>
            </Line>
            <Line
                title="Log out all devices"
                description="Log out from all devices. Changes may take up to 30 minutes."
            >
                <Button
                    className="!text-[1rem] !shadow-[inset_0_0_0_0.0625rem_#D73E3D] !text-error-100 hover:!bg-error-100 hover:!text-gray-0"
                    isSecondary
                    isSmall
                >
                    Log Out All
                </Button>
            </Line>
        </TabContainer>
    );
};

export default Security;
