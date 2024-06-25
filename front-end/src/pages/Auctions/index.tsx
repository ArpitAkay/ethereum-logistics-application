import { useEffect } from "react";
import ServiceCard from "../../components/ServiceCard";
import { AppDispatch } from "../../store";
import { useDispatch, useSelector } from "react-redux";
import { getAuctionsList, isSRDetailsVisible } from "../../store/sr/sr.selector";
import { fetchAuctions, hideSRDetails, showSRDetails } from "../../store/sr/sr.reducer";
import ServiceDetails from "../../components/ServiceDetails";
import { getCurrentRole, getUserProfile } from "../../store/users/user.selector";
import { EUserRole } from "../../repository/enum";
import { ContentWrapper } from "../../components/ContentWrapper";

const Auctions = () => {
  const dispatch: AppDispatch = useDispatch();
  const auctions = useSelector(getAuctionsList);
  const isSRDetailPopupOpen = useSelector(isSRDetailsVisible);
  const currentRole = useSelector(getCurrentRole);
  const user = useSelector(getUserProfile);

  useEffect(() => {
    dispatch(fetchAuctions());
  }, [user.uid, currentRole]);

  return (
    <ContentWrapper>
      <div className="bg-teal-700 text-white mx-4 rounded-lg flex flex-row justify-between">
        <h2 className="ml-2 p-2 text-2xl font-['PoetsenOne']">Auctions</h2>
      </div>
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-4 px-4 mt-4">
          {auctions.map((item, index) => (
            <ServiceCard
              item={item}
              key={index}
              isDriver={currentRole === EUserRole.Driver}
              onViewDetailPress={() => dispatch(showSRDetails(item))}
            />
          ))}
        </div>
        {!auctions.length && (
          <div className="flex items-center justify-center w-full h-24 text-xl">
            <p>No auctions found.</p>
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

export default Auctions;
