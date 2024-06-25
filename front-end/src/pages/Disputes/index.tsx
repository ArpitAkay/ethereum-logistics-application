import { useDispatch, useSelector } from "react-redux";
import ServiceCard from "../../components/ServiceCard";
import { AppDispatch } from "../../store";
import { getDisputesList, isSRDetailsVisible } from "../../store/sr/sr.selector";
import { fetchDisputes, hideSRDetails, showSRDetails } from "../../store/sr/sr.reducer";
import { useEffect } from "react";
import ServiceDetails from "../../components/ServiceDetails";
import { getCurrentRole, getUserProfile } from "../../store/users/user.selector";
import { ContentWrapper } from "../../components/ContentWrapper";

const Disputes = () => {
  const dispatch: AppDispatch = useDispatch();
  const disputes = useSelector(getDisputesList);
  const isSRDetailPopupOpen = useSelector(isSRDetailsVisible);
  const currentRole = useSelector(getCurrentRole);
  const user = useSelector(getUserProfile);

  useEffect(() => {
    dispatch(fetchDisputes());
  }, [user.uid, currentRole]);

  return (
    <ContentWrapper>
      <div className="bg-teal-700 text-white mx-4 rounded-lg flex flex-row justify-between">
        <h2 className="ml-2 p-2 text-2xl font-['PoetsenOne']">Disputes</h2>
      </div>
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-4 px-4 mt-4">
          {disputes.map((dispute, index) => (
            <ServiceCard
              item={dispute}
              key={index}
              onViewDetailPress={() => {
                dispatch(showSRDetails(dispute));
              }}
            />
          ))}
        </div>
        {!disputes.length && (
          <div className="flex items-center justify-center w-full h-24 text-xl">
            <p>No disputes found.</p>
          </div>
        )}
        {isSRDetailPopupOpen && (
          <ServiceDetails
            open={isSRDetailPopupOpen}
            onClose={() => {
              dispatch(hideSRDetails());
            }}
          />
        )}
      </div>
    </ContentWrapper>
  );
};

export default Disputes;
