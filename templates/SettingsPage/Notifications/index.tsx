import { useState } from "react";
import Switch from "@/components/Switch";
import TabContainer from "../TabContainer";
import Line from "../Line";

const Notifications = ({}) => {
    const [newMessageAlerts, setNewMessageAlerts] = useState(true);
    const [responseCompleted, setResponseCompleted] = useState(true);
    const [fileUploadStatus, setFileUploadStatus] = useState(true);

    return (
        <TabContainer title="Notification Setting">
            <Line
                title="New Message Alerts"
                description="Get notified when a new message or response is generated."
            >
                <Switch
                    checked={newMessageAlerts}
                    onChange={setNewMessageAlerts}
                />
            </Line>
            <Line
                title="Response Completed"
                description="Receive an alert when a long generation or file task is finished."
            >
                <Switch
                    checked={responseCompleted}
                    onChange={setResponseCompleted}
                />
            </Line>
            <Line
                title="File Upload Status"
                description="Be notified when your file has been successfully uploaded or processed."
            >
                <Switch
                    checked={fileUploadStatus}
                    onChange={setFileUploadStatus}
                />
            </Line>
        </TabContainer>
    );
};

export default Notifications;
