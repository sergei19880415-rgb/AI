import Button from "@/components/Button";
import TabContainer from "../TabContainer";
import Line from "../Line";

const Account = ({}) => {
    return (
        <TabContainer title="Account">
            <Line
                title="Display Name"
                description="Set the name that Zyra will use when addressing you in chat."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    Edit name
                </Button>
            </Line>
            <Line
                title="Email Address"
                description="Manage your email used for login and account recovery."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    Change email
                </Button>
            </Line>
            <Line
                title="Password"
                description="Update your password to maintain account security."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    Change password
                </Button>
            </Line>
            <Line
                title="Linked Accounts"
                description="Connect or disconnect your external accounts (e.g. Google, GitHub)."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    Manage
                </Button>
            </Line>
            <Line
                title="Subscription Plan"
                description="View or upgrade your current Zyra plan to access premium features."
            >
                <Button className="!text-[1rem]" isSecondary isSmall>
                    View Plan
                </Button>
            </Line>
            <Line
                title="Delete Account"
                description="Permanently remove your Zyra account and all associated data."
            >
                <Button
                    className="!text-[1rem] !shadow-[inset_0_0_0_0.0625rem_#D73E3D] !text-error-100 hover:!bg-error-100 hover:!text-gray-0"
                    isSecondary
                    isSmall
                >
                    Delete Account
                </Button>
            </Line>
        </TabContainer>
    );
};

export default Account;
