import { Instagram } from "lucide-react";
import { UserData } from "@/types/firebase";
import { capitalizeFirstLetter, toDateOrUndefined } from "@/lib/utils";

const SkaterProfileCard = ({ skater }: { skater: UserData }) => {
  const dateOfBirth = toDateOrUndefined(skater.dateOfBirth);
  return (
    <div className="w-full text-white p-6 rounded-lg border-2 flex gap-4">
      {/* Left: Profile Image */}
      <div className="flex">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
          <img
            src={skater.profilePictureUrl || "/placeholder-profile.webp"}
            alt="Skater profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right: Info */}
      <div className="w-full">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-normal mb-1">{skater.name}</h2>
          <div>
            {skater.instagram && (
              <a
                href={`https://www.instagram.com/${skater.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
              >
                <Instagram size={36} />
              </a>
            )}
            {/*<div className="text-right">*/}
            {/*  <div className="text-2xl font-light">Rank 1</div>*/}
            {/*  <div className="text-2xl font-light">#</div>*/}
            {/*</div>*/}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-light">
            {dateOfBirth instanceof Date && dateOfBirth.toLocaleDateString()}
          </p>
          {/*<p className="text-lg font-light">170cm / 65kg</p>*/}
          <p className="text-lg font-light">
            {capitalizeFirstLetter(skater.stance)}
          </p>
          <p className="text-lg font-light">{skater.sponsor}</p>
        </div>
      </div>
    </div>
  );
};

export default SkaterProfileCard;
