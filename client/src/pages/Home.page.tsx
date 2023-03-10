import "./Home.scss";

import { useEffect, useMemo, useState } from "react";
import {
  useGetDataQuery,
  useGetScheduledQuery,
} from "../features/api/apiDataSlice";
import OfficeComponent from "../features/data/components/Office.component";
import Tabs, { Tab } from "../components/Tabs/Tabs.component";
import LoadingComponent from "../components/Loading/Loading.component";
import SmallLabelComponent from "../components/SmallLabel/SmallLabel.component";
import { useAppDispatch, useAppSelector } from "../store/features/store";
import { setScheduled } from "../store/features/dataSlice";
import isToday from "../utils/datesCalculates/isToday";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import SittingTodayComponent from "../features/data/components/SittingToday/SittingToday.component";
import PermissionComponent from "../features/Permissions/components/Permission.component";

function HomePage() {
  const [showSittingToday, setShowSittingToday] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, data, isError } = useGetDataQuery("data");
  const { data: dataScheduled } = useGetScheduledQuery("scheduled");
  const [signedUser, isSigned] = useAppSelector((state) => [
    state.signed.signedUser,
    state.signed.isSigned,
  ]);

  useEffect(() => {
    if (!isSigned) {
      navigate("/signin");
    }
  }, [isSigned, navigate]);

  useEffect(() => {
    if (dataScheduled) {
      dispatch(setScheduled(dataScheduled));
    }
  }, [dataScheduled, dispatch]);

  const renderedOffices = useMemo(
    () =>
      data?.map((officeData: any) => {
        return (
          <div className="office-wrapper" key={officeData?.office._id}>
            <OfficeComponent officeData={officeData} />
          </div>
        );
      }),
    [data]
  );

  const errorComponent = useMemo(() => {
    return (
      <SmallLabelComponent
        labelStyle={{
          color: "red !important",
          fontWeight: "600",
          fontSize: "1.5rem",
        }}
      >
        ERROR while loading data, please try again
      </SmallLabelComponent>
    );
  }, []);

  const sittingToday = dataScheduled?.filter((scheduled: any) => {
    return (
      scheduled.employee.email === signedUser?.email &&
      isToday(scheduled.startDate, scheduled.endDate, scheduled.repeatEvery)
    );
  })[0];

  return (
    <PermissionComponent
      levelPermitted={["Employee", "Admin"]}
      showError
      errorLabel="You need to Sign In to see this page."
    >
      {isLoading ? (
        <div className="loading">
          <LoadingComponent />
        </div>
      ) : isError ? (
        errorComponent
      ) : (
        data && (
          <div className="main">
            {
              <Button
                sx={{
                  color: "#88ffeb80 !important",
                  padding: 0,
                  border: "#88ffeb80 1px solid",
                }}
                onClick={() => setShowSittingToday(!showSittingToday)}
              >
                Where am I sitting Today?
              </Button>
            }
            {showSittingToday && (
              <SittingTodayComponent data={data} sittingToday={sittingToday} />
            )}
            <Tabs>
              {renderedOffices?.map((office: any, index: number) => {
                return (
                  <Tab label={data[index].office.description} key={index}>
                    {office}
                  </Tab>
                );
              })}
            </Tabs>
          </div>
        )
      )}
    </PermissionComponent>
  );
}

export default HomePage;
