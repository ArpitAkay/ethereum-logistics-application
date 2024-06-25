import { useEffect, useMemo } from "react";
import ServiceForm from "../../components/AddServiceForm";
import ServiceCard from "../../components/ServiceCard";
import ServiceDetails from "../../components/ServiceDetails";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchServiceRequests,
  hideSRCreateForm,
  hideSRDetails,
  showSRCreateForm,
  showSRDetails,
} from "../../store/sr/sr.reducer";
import { AppDispatch } from "../../store";
import {
  getSRList,
  isCreateFormVisible,
  isSRDetailsVisible,
} from "../../store/sr/sr.selector";
import { EStatus, EUserRole } from "../../repository/enum";
import {
  getCurrentRole,
  getUserProfile,
} from "../../store/users/user.selector";
import { ContentWrapper } from "../../components/ContentWrapper";

const ServiceRequests = () => {
  const isSRDetailPopupOpen = useSelector(isSRDetailsVisible);
  const createFormOpen = useSelector(isCreateFormVisible);
  const dispatch: AppDispatch = useDispatch();
  const srList = useSelector(getSRList);
  const user = useSelector(getUserProfile);
  const currentRole = useSelector(getCurrentRole);
  const pastSRs = useMemo(() => {
    return srList.filter((sr) =>
      [
        EStatus.CONDITIONALLY_ACCEPTED,
        EStatus.UNCONDITIONALLY_ACCEPTED,
        EStatus.CANCELLED,
        EStatus.DISPUTE_RESOLVED,
      ].includes(sr.status as never as EStatus)
    );
  }, [srList]);

  const activeSRs = useMemo(() => {
    return srList.filter(
      (sr) =>
        ![
          EStatus.CONDITIONALLY_ACCEPTED,
          EStatus.UNCONDITIONALLY_ACCEPTED,
          EStatus.CANCELLED,
          EStatus.DISPUTE_RESOLVED,
        ].includes(sr.status as never as EStatus)
    );
  }, [srList]);

  useEffect(() => {
    dispatch(fetchServiceRequests());
  }, [user.uid, currentRole]);

  return (
    <ContentWrapper>
      <div className="bg-teal-700 text-white mx-4 rounded-lg flex flex-row justify-between mb-5">
        <h2 className="ml-2 p-2 text-2xl font-['PoetsenOne']">
          Active requests
        </h2>
        {user.uid && currentRole === EUserRole.Shipper && (
          <button
            className="h-8 px-4 m-2 text-sm text-black transition-colors bg-white rounded-lg focus:shadow-outline hover:bg-black hover:text-white duration-200"
            onClick={() => dispatch(showSRCreateForm({ editMode: false }))}
          >
            Create Service Request
          </button>
        )}
      </div>
      <div>
        {activeSRs.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-4 px-4 mt-4">
            {activeSRs.map((item, index) => {
              return (
                <ServiceCard
                  key={index + user.uid}
                  item={item}
                  isShipper={
                    user.uid?.toLocaleLowerCase() ===
                    item.shipperUID?.toLocaleLowerCase()
                  }
                  isReceiver={
                    user.uid?.toLocaleLowerCase() ===
                    item.receiverUID?.toLocaleLowerCase()
                  }
                  isDriver={
                    user.uid?.toLocaleLowerCase() ===
                    item.driverUID?.toLocaleLowerCase()
                  }
                  onViewDetailPress={() => {
                    dispatch(showSRDetails(item));
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-24">
            <p className="text-2l">No Active Service requests found.</p>
          </div>
        )}
        <div className="bg-teal-700 text-white mx-4 mt-5 rounded-lg">
          <h2 className="ml-2 p-2 text-2xl font-['PoetsenOne']">
            Past requests
          </h2>
        </div>

        {pastSRs.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-4 px-4 my-4">
            {pastSRs.map((item, index) => (
              <ServiceCard
                key={index + user.uid}
                item={item}
                isShipper={
                  user.uid?.toLocaleLowerCase() ===
                  item.shipperUID?.toLocaleLowerCase()
                }
                isReceiver={
                  user.uid?.toLocaleLowerCase() ===
                  item.receiverUID?.toLocaleLowerCase()
                }
                isDriver={
                  user.uid?.toLocaleLowerCase() ===
                  item.driverUID?.toLocaleLowerCase()
                }
                onViewDetailPress={() => dispatch(showSRDetails(item))}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-24">
            <p>No Previous Service requests found.</p>
          </div>
        )}

        {createFormOpen && (
          <ServiceForm
            open={createFormOpen}
            onClose={() => dispatch(hideSRCreateForm())}
          />
        )}

        {isSRDetailPopupOpen && (
          <ServiceDetails
            open={isSRDetailPopupOpen}
            onClose={() => dispatch(hideSRDetails())}
          />
        )}
      </div>
    </ContentWrapper>
  );
};

export default ServiceRequests;
