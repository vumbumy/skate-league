import { Instagram } from "lucide-react";
import { UserData } from "@/types/firebase";
import { capitalizeFirstLetter, toDateOrUndefined } from "@/lib/utils";

const SkaterProfileCard = ({ skater }: { skater: UserData }) => {
  const dateOfBirth = toDateOrUndefined(skater.dateOfBirth);
  return (
    <div className="w-full  text-white p-6 rounded-lg border-2">
      <div className="flex items-center">
        {/* Left: Profile Image */}
        <div className="mr-8">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            <img
              src={skater.profilePictureUrl || "/placeholder-profile.webp"}
              alt="Skater profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-normal mb-1">{skater.name}</h2>
              {/*<h3 className="text-xl font-light">taeyoun kim</h3>*/}
            </div>

            <div className="flex items-center">
              <Instagram size={36} />
              {/*<div className="text-right">*/}
              {/*  <div className="text-2xl font-light">Rank 1</div>*/}
              {/*  <div className="text-2xl font-light">#</div>*/}
              {/*</div>*/}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xl font-light">
              {dateOfBirth instanceof Date && dateOfBirth.toLocaleDateString()}
            </p>
            {/*<p className="text-xl font-light">170cm / 65kg</p>*/}
            <p className="text-xl font-light">
              {capitalizeFirstLetter(skater.stance)}
            </p>
            <p className="text-xl font-light">{skater.sponsor}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkaterProfileCard;
