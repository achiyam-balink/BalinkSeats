import "./Office.scss";

import { useMemo } from "react";

import FormWrapper from "../../../components/BoxGridForm/BoxGridForm.component";
import AreaComponent from "./Area.component";
import maxXY from "../../../utils/dataAnalayze/maxXY";

const OfficeComponent = ({ officeData }: any) => {
  const [maxX] = maxXY(officeData.areas, "area");
  const renderedAreas = useMemo(
    () => (
      <div
        className="areas-wrapper"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${maxX + 1}, ${100 / (maxX + 1)}%)`,
        }}
      >
        {officeData.areas?.map((areaData: any) => {
          return <AreaComponent areaData={areaData} key={areaData.area._id} />;
        })}
      </div>
    ),
    [officeData, maxX]
  );
  return (
    <FormWrapper
      boxStyle={{
        width: "90%",
        maxHeight: "80%",
        overflow: "auto",
        padding: "0",
        borderWidth: "0.2rem",
        borderRadius: "5rem",
        borderStyle: "dotted",
      }}
      gridStyle={{
        padding: "0.5rem 1rem 1rem",
        gap: "1rem",
        flexWrap: "unset",
      }}
      titleStyle={{
        display: "none",
      }}
    >
      {renderedAreas}
    </FormWrapper>
  );
};

export default OfficeComponent;
