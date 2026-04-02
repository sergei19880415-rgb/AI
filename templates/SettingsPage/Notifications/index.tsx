import { useState } from "react";
import Switch from "@/components/Switch";
import TabContainer from "../TabContainer";
import Line from "../Line";

const Notifications = ({}) => {
    const [responseCompleted, setResponseCompleted] = useState(true);
    const [fileUploadStatus, setFileUploadStatus] = useState(true);

    return (
        <TabContainer title="Уведомления">
            <Line
                title="Завершение ответа"
                description="Показывать уведомление, когда AI завершил ответ."
            >
                <Switch
                    checked={responseCompleted}
                    onChange={setResponseCompleted}
                />
            </Line>
            <Line
                title="Завершение обработки файла"
                description="Показывать уведомление после обработки загруженного файла."
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
