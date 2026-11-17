"use client";

// Escro icon set: Phosphor icons (via react-icons/pi).
// Duotone by default, Fill when the icon is given a fill (e.g. rating stars),
// Bold for tiny UI glyphs (chevrons, check, close).
// Exported under the previous lucide / tabler / react-icons names so imports stay drop-in.
// To restyle every icon in the app, change the variant here.

import * as React from "react";
import {
  PiArrowLeftBold,
  PiArrowLeftFill,
  PiArrowRightBold,
  PiArrowRightFill,
  PiArrowSquareOutBold,
  PiArrowSquareOutFill,
  PiArrowUpBold,
  PiArrowUpFill,
  PiArrowUpRightBold,
  PiArrowUpRightFill,
  PiArrowsClockwiseDuotone,
  PiArrowsClockwiseFill,
  PiBankDuotone,
  PiBankFill,
  PiBarbellDuotone,
  PiBarbellFill,
  PiBellRingingDuotone,
  PiBellRingingFill,
  PiBicycleDuotone,
  PiBicycleFill,
  PiBookOpenDuotone,
  PiBookOpenFill,
  PiBriefcaseDuotone,
  PiBriefcaseFill,
  PiBuildingDuotone,
  PiBuildingFill,
  PiBuildingsDuotone,
  PiBuildingsFill,
  PiCalendarBlankDuotone,
  PiCalendarBlankFill,
  PiCalendarCheckDuotone,
  PiCalendarCheckFill,
  PiCalendarDotsDuotone,
  PiCalendarDotsFill,
  PiCalendarDuotone,
  PiCalendarFill,
  PiCameraDuotone,
  PiCameraFill,
  PiCarDuotone,
  PiCarFill,
  PiCaretDownBold,
  PiCaretDownFill,
  PiCaretRightBold,
  PiCaretRightFill,
  PiCaretUpBold,
  PiCaretUpFill,
  PiChartBarDuotone,
  PiChartBarFill,
  PiChatCenteredTextDuotone,
  PiChatCenteredTextFill,
  PiChatCircleDotsDuotone,
  PiChatCircleDotsFill,
  PiCheckBold,
  PiCheckCircleDuotone,
  PiCheckCircleFill,
  PiCheckFill,
  PiChecksBold,
  PiChecksFill,
  PiCircleBold,
  PiCircleFill,
  PiCircleNotchBold,
  PiCircleNotchFill,
  PiClockCountdownDuotone,
  PiClockCountdownFill,
  PiClockDuotone,
  PiClockFill,
  PiCloudArrowDownDuotone,
  PiCloudArrowDownFill,
  PiCodeDuotone,
  PiCodeFill,
  PiCoinsDuotone,
  PiCoinsFill,
  PiCookingPotDuotone,
  PiCookingPotFill,
  PiCopyDuotone,
  PiCopyFill,
  PiCouchDuotone,
  PiCouchFill,
  PiCreditCardDuotone,
  PiCreditCardFill,
  PiCrosshairDuotone,
  PiCrosshairFill,
  PiCurrencyDollarDuotone,
  PiCurrencyDollarFill,
  PiCurrencyNgnDuotone,
  PiCurrencyNgnFill,
  PiDatabaseDuotone,
  PiDatabaseFill,
  PiDetectiveDuotone,
  PiDetectiveFill,
  PiDeviceMobileDuotone,
  PiDeviceMobileFill,
  PiDotOutlineBold,
  PiDotOutlineFill,
  PiDotsThreeBold,
  PiDotsThreeFill,
  PiDownloadSimpleDuotone,
  PiDownloadSimpleFill,
  PiEnvelopeOpenDuotone,
  PiEnvelopeOpenFill,
  PiEnvelopeSimpleDuotone,
  PiEnvelopeSimpleFill,
  PiEyeDuotone,
  PiEyeFill,
  PiEyeSlashDuotone,
  PiEyeSlashFill,
  PiFacebookLogoDuotone,
  PiFacebookLogoFill,
  PiFileTextDuotone,
  PiFileTextFill,
  PiFireDuotone,
  PiFireFill,
  PiFlaskDuotone,
  PiFlaskFill,
  PiFolderOpenDuotone,
  PiFolderOpenFill,
  PiFolderPlusDuotone,
  PiFolderPlusFill,
  PiFunnelDuotone,
  PiFunnelFill,
  PiGameControllerDuotone,
  PiGameControllerFill,
  PiGavelDuotone,
  PiGavelFill,
  PiGearSixDuotone,
  PiGearSixFill,
  PiGiftDuotone,
  PiGiftFill,
  PiGlobeHemisphereEastDuotone,
  PiGlobeHemisphereEastFill,
  PiHandCoinsDuotone,
  PiHandCoinsFill,
  PiHardDrivesDuotone,
  PiHardDrivesFill,
  PiHardHatDuotone,
  PiHardHatFill,
  PiHeadsetDuotone,
  PiHeadsetFill,
  PiHeartDuotone,
  PiHeartFill,
  PiHouseDuotone,
  PiHouseFill,
  PiImageDuotone,
  PiImageFill,
  PiInstagramLogoDuotone,
  PiInstagramLogoFill,
  PiKanbanDuotone,
  PiKanbanFill,
  PiKeyDuotone,
  PiKeyFill,
  PiLaptopDuotone,
  PiLaptopFill,
  PiLightningDuotone,
  PiLightningFill,
  PiLinkedinLogoDuotone,
  PiLinkedinLogoFill,
  PiListBold,
  PiListBulletsDuotone,
  PiListBulletsFill,
  PiListFill,
  PiLockKeyDuotone,
  PiLockKeyFill,
  PiMagnifyingGlassDuotone,
  PiMagnifyingGlassFill,
  PiMapPinDuotone,
  PiMapPinFill,
  PiMapTrifoldDuotone,
  PiMapTrifoldFill,
  PiMedalDuotone,
  PiMedalFill,
  PiMegaphoneDuotone,
  PiMegaphoneFill,
  PiMicrophoneDuotone,
  PiMicrophoneFill,
  PiMoneyDuotone,
  PiMoneyFill,
  PiMonitorDuotone,
  PiMonitorFill,
  PiMopedDuotone,
  PiMopedFill,
  PiNavigationArrowDuotone,
  PiNavigationArrowFill,
  PiPackageDuotone,
  PiPackageFill,
  PiPaletteDuotone,
  PiPaletteFill,
  PiPaperPlaneRightDuotone,
  PiPaperPlaneRightFill,
  PiPaperclipDuotone,
  PiPaperclipFill,
  PiPathDuotone,
  PiPathFill,
  PiPaypalLogoDuotone,
  PiPaypalLogoFill,
  PiPencilSimpleDuotone,
  PiPencilSimpleFill,
  PiPencilSimpleLineDuotone,
  PiPencilSimpleLineFill,
  PiPercentDuotone,
  PiPercentFill,
  PiPhoneDuotone,
  PiPhoneFill,
  PiPlayDuotone,
  PiPlayFill,
  PiPlusBold,
  PiPlusFill,
  PiPowerDuotone,
  PiPowerFill,
  PiProhibitDuotone,
  PiProhibitFill,
  PiRadioButtonDuotone,
  PiRadioButtonFill,
  PiReceiptDuotone,
  PiReceiptFill,
  PiReceiptXDuotone,
  PiReceiptXFill,
  PiScalesDuotone,
  PiScalesFill,
  PiScrollDuotone,
  PiScrollFill,
  PiSealCheckDuotone,
  PiSealCheckFill,
  PiSealPercentDuotone,
  PiSealPercentFill,
  PiShareNetworkDuotone,
  PiShareNetworkFill,
  PiShieldCheckDuotone,
  PiShieldCheckFill,
  PiShieldWarningDuotone,
  PiShieldWarningFill,
  PiShoppingBagOpenDuotone,
  PiShoppingBagOpenFill,
  PiShoppingCartSimpleDuotone,
  PiShoppingCartSimpleFill,
  PiSidebarSimpleDuotone,
  PiSidebarSimpleFill,
  PiSignInDuotone,
  PiSignInFill,
  PiSignOutDuotone,
  PiSignOutFill,
  PiSignatureDuotone,
  PiSignatureFill,
  PiSlidersHorizontalDuotone,
  PiSlidersHorizontalFill,
  PiSortDescendingDuotone,
  PiSortDescendingFill,
  PiSparkleDuotone,
  PiSparkleFill,
  PiSquaresFourDuotone,
  PiSquaresFourFill,
  PiStackDuotone,
  PiStackFill,
  PiStarDuotone,
  PiStarFill,
  PiStorefrontDuotone,
  PiStorefrontFill,
  PiStripeLogoDuotone,
  PiStripeLogoFill,
  PiTShirtDuotone,
  PiTShirtFill,
  PiTagDuotone,
  PiTagFill,
  PiThumbsUpDuotone,
  PiThumbsUpFill,
  PiTrashDuotone,
  PiTrashFill,
  PiTrendDownDuotone,
  PiTrendDownFill,
  PiTrendUpDuotone,
  PiTrendUpFill,
  PiTruckDuotone,
  PiTruckFill,
  PiUploadSimpleDuotone,
  PiUploadSimpleFill,
  PiUserCircleDuotone,
  PiUserCircleFill,
  PiUserDuotone,
  PiUserFill,
  PiUserFocusDuotone,
  PiUserFocusFill,
  PiUserPlusDuotone,
  PiUserPlusFill,
  PiUsersDuotone,
  PiUsersFill,
  PiUsersThreeDuotone,
  PiUsersThreeFill,
  PiVideoCameraDuotone,
  PiVideoCameraFill,
  PiWalletDuotone,
  PiWalletFill,
  PiWarningCircleDuotone,
  PiWarningCircleFill,
  PiWarningDuotone,
  PiWarningFill,
  PiXBold,
  PiXCircleDuotone,
  PiXCircleFill,
  PiXFill,
  PiXLogoDuotone,
  PiXLogoFill,
} from "react-icons/pi";

export type IconProps = Omit<React.SVGProps<SVGSVGElement>, "stroke" | "strokeWidth" | "ref"> & {
  size?: number | string;
  stroke?: number | string;
  strokeWidth?: number | string;
  absoluteStrokeWidth?: boolean;
  title?: string;
};
export type LucideIcon = React.ComponentType<IconProps>;

type PiComp = React.ComponentType<Record<string, unknown>>;

function make(base: unknown, filled: unknown, name: string): LucideIcon {
  const Base = base as PiComp;
  const Filled = filled as PiComp;
  function Icon({
    size = 24,
    stroke: _stroke,
    strokeWidth: _strokeWidth,
    absoluteStrokeWidth: _abs,
    fill,
    className,
    ...rest
  }: IconProps) {
    const wantsFill = (!!fill && fill !== "none" && fill !== "transparent") || /(^|\s)fill-(?!none)/.test(className ?? "");
    const C = wantsFill ? Filled : Base;
    return <C size={size} className={className} {...(rest as Record<string, unknown>)} />;
  }
  Icon.displayName = name;
  return Icon;
}

export const AiOutlineEye = make(PiEyeDuotone, PiEyeFill, "AiOutlineEye");
export const AlertCircle = make(PiWarningCircleDuotone, PiWarningCircleFill, "AlertCircle");
export const ArrowLeft = make(PiArrowLeftBold, PiArrowLeftFill, "ArrowLeft");
export const ArrowRight = make(PiArrowRightBold, PiArrowRightFill, "ArrowRight");
export const ArrowUp = make(PiArrowUpBold, PiArrowUpFill, "ArrowUp");
export const ArrowUpRight = make(PiArrowUpRightBold, PiArrowUpRightFill, "ArrowUpRight");
export const Award = make(PiMedalDuotone, PiMedalFill, "Award");
export const BadgeCheck = make(PiSealCheckDuotone, PiSealCheckFill, "BadgeCheck");
export const Ban = make(PiProhibitDuotone, PiProhibitFill, "Ban");
export const BanknoteArrowDown = make(PiHandCoinsDuotone, PiHandCoinsFill, "BanknoteArrowDown");
export const BanknoteArrowUp = make(PiMoneyDuotone, PiMoneyFill, "BanknoteArrowUp");
export const BanknoteX = make(PiReceiptXDuotone, PiReceiptXFill, "BanknoteX");
export const Bell = make(PiBellRingingDuotone, PiBellRingingFill, "Bell");
export const Bike = make(PiBicycleDuotone, PiBicycleFill, "Bike");
export const Box = make(PiPackageDuotone, PiPackageFill, "Box");
export const Briefcase = make(PiBriefcaseDuotone, PiBriefcaseFill, "Briefcase");
export const BsArrowLeft = make(PiArrowLeftBold, PiArrowLeftFill, "BsArrowLeft");
export const BsCameraVideo = make(PiVideoCameraDuotone, PiVideoCameraFill, "BsCameraVideo");
export const BsDot = make(PiDotOutlineBold, PiDotOutlineFill, "BsDot");
export const Building = make(PiBuildingDuotone, PiBuildingFill, "Building");
export const Building2 = make(PiBuildingsDuotone, PiBuildingsFill, "Building2");
export const CalendarClock = make(PiCalendarDotsDuotone, PiCalendarDotsFill, "CalendarClock");
export const CalendarDays = make(PiCalendarDotsDuotone, PiCalendarDotsFill, "CalendarDays");
export const Camera = make(PiCameraDuotone, PiCameraFill, "Camera");
export const Car = make(PiCarDuotone, PiCarFill, "Car");
export const Check = make(PiCheckBold, PiCheckFill, "Check");
export const CheckCircle = make(PiCheckCircleDuotone, PiCheckCircleFill, "CheckCircle");
export const CheckCircle2 = make(PiCheckCircleDuotone, PiCheckCircleFill, "CheckCircle2");
export const CheckIcon = make(PiCheckBold, PiCheckFill, "CheckIcon");
export const ChevronDown = make(PiCaretDownBold, PiCaretDownFill, "ChevronDown");
export const ChevronDownIcon = make(PiCaretDownBold, PiCaretDownFill, "ChevronDownIcon");
export const ChevronRight = make(PiCaretRightBold, PiCaretRightFill, "ChevronRight");
export const ChevronRightIcon = make(PiCaretRightBold, PiCaretRightFill, "ChevronRightIcon");
export const ChevronUp = make(PiCaretUpBold, PiCaretUpFill, "ChevronUp");
export const ChevronUpIcon = make(PiCaretUpBold, PiCaretUpFill, "ChevronUpIcon");
export const CiCamera = make(PiCameraDuotone, PiCameraFill, "CiCamera");
export const CiSearch = make(PiMagnifyingGlassDuotone, PiMagnifyingGlassFill, "CiSearch");
export const Circle = make(PiCircleBold, PiCircleFill, "Circle");
export const CircleAlert = make(PiWarningCircleDuotone, PiWarningCircleFill, "CircleAlert");
export const CircleCheck = make(PiCheckCircleDuotone, PiCheckCircleFill, "CircleCheck");
export const CircleIcon = make(PiCircleBold, PiCircleFill, "CircleIcon");
export const CircleStar = make(PiSealPercentDuotone, PiSealPercentFill, "CircleStar");
export const ClipboardClock = make(PiClockCountdownDuotone, PiClockCountdownFill, "ClipboardClock");
export const Clock = make(PiClockDuotone, PiClockFill, "Clock");
export const Clock4 = make(PiClockDuotone, PiClockFill, "Clock4");
export const Construction = make(PiHardHatDuotone, PiHardHatFill, "Construction");
export const Copy = make(PiCopyDuotone, PiCopyFill, "Copy");
export const CreditCard = make(PiCreditCardDuotone, PiCreditCardFill, "CreditCard");
export const DatabaseBackup = make(PiDatabaseDuotone, PiDatabaseFill, "DatabaseBackup");
export const DatabaseZap = make(PiDatabaseDuotone, PiDatabaseFill, "DatabaseZap");
export const DollarSign = make(PiCurrencyDollarDuotone, PiCurrencyDollarFill, "DollarSign");
export const Download = make(PiDownloadSimpleDuotone, PiDownloadSimpleFill, "Download");
export const Edit = make(PiPencilSimpleLineDuotone, PiPencilSimpleLineFill, "Edit");
export const Eye = make(PiEyeDuotone, PiEyeFill, "Eye");
export const EyeOff = make(PiEyeSlashDuotone, PiEyeSlashFill, "EyeOff");
export const FaMicrophone = make(PiMicrophoneDuotone, PiMicrophoneFill, "FaMicrophone");
export const Facebook = make(PiFacebookLogoDuotone, PiFacebookLogoFill, "Facebook");
export const FileText = make(PiFileTextDuotone, PiFileTextFill, "FileText");
export const FolderKanban = make(PiKanbanDuotone, PiKanbanFill, "FolderKanban");
export const FolderOpen = make(PiFolderOpenDuotone, PiFolderOpenFill, "FolderOpen");
export const FolderPlus = make(PiFolderPlusDuotone, PiFolderPlusFill, "FolderPlus");
export const Gavel = make(PiGavelDuotone, PiGavelFill, "Gavel");
export const GiPaperClip = make(PiPaperclipDuotone, PiPaperclipFill, "GiPaperClip");
export const Globe = make(PiGlobeHemisphereEastDuotone, PiGlobeHemisphereEastFill, "Globe");
export const HatGlasses = make(PiDetectiveDuotone, PiDetectiveFill, "HatGlasses");
export const HiOutlineDotsHorizontal = make(PiDotsThreeBold, PiDotsThreeFill, "HiOutlineDotsHorizontal");
export const Home = make(PiHouseDuotone, PiHouseFill, "Home");
export const IconAdjustments = make(PiSlidersHorizontalDuotone, PiSlidersHorizontalFill, "IconAdjustments");
export const IconAdjustmentsHorizontal = make(PiSlidersHorizontalDuotone, PiSlidersHorizontalFill, "IconAdjustmentsHorizontal");
export const IconAlertCircle = make(PiWarningCircleDuotone, PiWarningCircleFill, "IconAlertCircle");
export const IconAlertTriangle = make(PiWarningDuotone, PiWarningFill, "IconAlertTriangle");
export const IconArrowRight = make(PiArrowRightBold, PiArrowRightFill, "IconArrowRight");
export const IconArrowUpRight = make(PiArrowUpRightBold, PiArrowUpRightFill, "IconArrowUpRight");
export const IconBan = make(PiProhibitDuotone, PiProhibitFill, "IconBan");
export const IconBarbell = make(PiBarbellDuotone, PiBarbellFill, "IconBarbell");
export const IconBell = make(PiBellRingingDuotone, PiBellRingingFill, "IconBell");
export const IconBolt = make(PiLightningDuotone, PiLightningFill, "IconBolt");
export const IconBook = make(PiBookOpenDuotone, PiBookOpenFill, "IconBook");
export const IconBrandPaypal = make(PiPaypalLogoDuotone, PiPaypalLogoFill, "IconBrandPaypal");
export const IconBrandStripe = make(PiStripeLogoDuotone, PiStripeLogoFill, "IconBrandStripe");
export const IconBriefcase = make(PiBriefcaseDuotone, PiBriefcaseFill, "IconBriefcase");
export const IconBuilding = make(PiBuildingsDuotone, PiBuildingsFill, "IconBuilding");
export const IconBuildingBank = make(PiBankDuotone, PiBankFill, "IconBuildingBank");
export const IconBuildingStore = make(PiStorefrontDuotone, PiStorefrontFill, "IconBuildingStore");
export const IconCalendar = make(PiCalendarBlankDuotone, PiCalendarBlankFill, "IconCalendar");
export const IconCalendarEvent = make(PiCalendarCheckDuotone, PiCalendarCheckFill, "IconCalendarEvent");
export const IconCalendarMonth = make(PiCalendarDotsDuotone, PiCalendarDotsFill, "IconCalendarMonth");
export const IconCalendarWeek = make(PiCalendarDuotone, PiCalendarFill, "IconCalendarWeek");
export const IconCamera = make(PiCameraDuotone, PiCameraFill, "IconCamera");
export const IconCash = make(PiMoneyDuotone, PiMoneyFill, "IconCash");
export const IconChartBar = make(PiChartBarDuotone, PiChartBarFill, "IconChartBar");
export const IconCheck = make(PiCheckBold, PiCheckFill, "IconCheck");
export const IconChecks = make(PiChecksBold, PiChecksFill, "IconChecks");
export const IconChevronDown = make(PiCaretDownBold, PiCaretDownFill, "IconChevronDown");
export const IconChevronRight = make(PiCaretRightBold, PiCaretRightFill, "IconChevronRight");
export const IconChevronUp = make(PiCaretUpBold, PiCaretUpFill, "IconChevronUp");
export const IconCircleCheck = make(PiCheckCircleDuotone, PiCheckCircleFill, "IconCircleCheck");
export const IconCircleDot = make(PiRadioButtonDuotone, PiRadioButtonFill, "IconCircleDot");
export const IconClock = make(PiClockDuotone, PiClockFill, "IconClock");
export const IconCloudDownload = make(PiCloudArrowDownDuotone, PiCloudArrowDownFill, "IconCloudDownload");
export const IconCode = make(PiCodeDuotone, PiCodeFill, "IconCode");
export const IconCopy = make(PiCopyDuotone, PiCopyFill, "IconCopy");
export const IconCreditCard = make(PiCreditCardDuotone, PiCreditCardFill, "IconCreditCard");
export const IconCurrency = make(PiCoinsDuotone, PiCoinsFill, "IconCurrency");
export const IconCurrencyDollar = make(PiCurrencyDollarDuotone, PiCurrencyDollarFill, "IconCurrencyDollar");
export const IconCurrencyNaira = make(PiCurrencyNgnDuotone, PiCurrencyNgnFill, "IconCurrencyNaira");
export const IconCurrentLocation = make(PiCrosshairDuotone, PiCrosshairFill, "IconCurrentLocation");
export const IconDeviceGamepad2 = make(PiGameControllerDuotone, PiGameControllerFill, "IconDeviceGamepad2");
export const IconDeviceLaptop = make(PiLaptopDuotone, PiLaptopFill, "IconDeviceLaptop");
export const IconDeviceMobile = make(PiDeviceMobileDuotone, PiDeviceMobileFill, "IconDeviceMobile");
export const IconDownload = make(PiDownloadSimpleDuotone, PiDownloadSimpleFill, "IconDownload");
export const IconEdit = make(PiPencilSimpleLineDuotone, PiPencilSimpleLineFill, "IconEdit");
export const IconExternalLink = make(PiArrowSquareOutBold, PiArrowSquareOutFill, "IconExternalLink");
export const IconEye = make(PiEyeDuotone, PiEyeFill, "IconEye");
export const IconFileCheck = make(PiFileTextDuotone, PiFileTextFill, "IconFileCheck");
export const IconFileText = make(PiFileTextDuotone, PiFileTextFill, "IconFileText");
export const IconFilter = make(PiFunnelDuotone, PiFunnelFill, "IconFilter");
export const IconFlame = make(PiFireDuotone, PiFireFill, "IconFlame");
export const IconFocus2 = make(PiCrosshairDuotone, PiCrosshairFill, "IconFocus2");
export const IconGift = make(PiGiftDuotone, PiGiftFill, "IconGift");
export const IconHeadset = make(PiHeadsetDuotone, PiHeadsetFill, "IconHeadset");
export const IconHeart = make(PiHeartDuotone, PiHeartFill, "IconHeart");
export const IconLayersSubtract = make(PiStackDuotone, PiStackFill, "IconLayersSubtract");
export const IconLayoutDashboard = make(PiSquaresFourDuotone, PiSquaresFourFill, "IconLayoutDashboard");
export const IconLayoutGrid = make(PiSquaresFourDuotone, PiSquaresFourFill, "IconLayoutGrid");
export const IconList = make(PiListBulletsDuotone, PiListBulletsFill, "IconList");
export const IconLogout = make(PiSignOutDuotone, PiSignOutFill, "IconLogout");
export const IconMail = make(PiEnvelopeSimpleDuotone, PiEnvelopeSimpleFill, "IconMail");
export const IconMap = make(PiMapTrifoldDuotone, PiMapTrifoldFill, "IconMap");
export const IconMapPin = make(PiMapPinDuotone, PiMapPinFill, "IconMapPin");
export const IconMenu = make(PiListBold, PiListFill, "IconMenu");
export const IconMenu2 = make(PiListBold, PiListFill, "IconMenu2");
export const IconMessage = make(PiChatCenteredTextDuotone, PiChatCenteredTextFill, "IconMessage");
export const IconMessageCircle = make(PiChatCircleDotsDuotone, PiChatCircleDotsFill, "IconMessageCircle");
export const IconMotorbike = make(PiMopedDuotone, PiMopedFill, "IconMotorbike");
export const IconNavigation = make(PiNavigationArrowDuotone, PiNavigationArrowFill, "IconNavigation");
export const IconPackage = make(PiPackageDuotone, PiPackageFill, "IconPackage");
export const IconPalette = make(PiPaletteDuotone, PiPaletteFill, "IconPalette");
export const IconPencil = make(PiPencilSimpleDuotone, PiPencilSimpleFill, "IconPencil");
export const IconPercentage = make(PiPercentDuotone, PiPercentFill, "IconPercentage");
export const IconPhone = make(PiPhoneDuotone, PiPhoneFill, "IconPhone");
export const IconPhoto = make(PiImageDuotone, PiImageFill, "IconPhoto");
export const IconPlayerPlay = make(PiPlayDuotone, PiPlayFill, "IconPlayerPlay");
export const IconPlus = make(PiPlusBold, PiPlusFill, "IconPlus");
export const IconPower = make(PiPowerDuotone, PiPowerFill, "IconPower");
export const IconReceipt = make(PiReceiptDuotone, PiReceiptFill, "IconReceipt");
export const IconRefresh = make(PiArrowsClockwiseDuotone, PiArrowsClockwiseFill, "IconRefresh");
export const IconRoute = make(PiPathDuotone, PiPathFill, "IconRoute");
export const IconRoute2 = make(PiPathDuotone, PiPathFill, "IconRoute2");
export const IconRouteOff = make(PiPathDuotone, PiPathFill, "IconRouteOff");
export const IconSearch = make(PiMagnifyingGlassDuotone, PiMagnifyingGlassFill, "IconSearch");
export const IconSettings = make(PiGearSixDuotone, PiGearSixFill, "IconSettings");
export const IconShare = make(PiShareNetworkDuotone, PiShareNetworkFill, "IconShare");
export const IconShieldCheck = make(PiShieldCheckDuotone, PiShieldCheckFill, "IconShieldCheck");
export const IconShirt = make(PiTShirtDuotone, PiTShirtFill, "IconShirt");
export const IconShoppingBag = make(PiShoppingBagOpenDuotone, PiShoppingBagOpenFill, "IconShoppingBag");
export const IconShoppingCart = make(PiShoppingCartSimpleDuotone, PiShoppingCartSimpleFill, "IconShoppingCart");
export const IconSofa = make(PiCouchDuotone, PiCouchFill, "IconSofa");
export const IconSortDescending = make(PiSortDescendingDuotone, PiSortDescendingFill, "IconSortDescending");
export const IconSparkles = make(PiSparkleDuotone, PiSparkleFill, "IconSparkles");
export const IconSpeakerphone = make(PiMegaphoneDuotone, PiMegaphoneFill, "IconSpeakerphone");
export const IconStar = make(PiStarDuotone, PiStarFill, "IconStar");
export const IconTag = make(PiTagDuotone, PiTagFill, "IconTag");
export const IconToolsKitchen2 = make(PiCookingPotDuotone, PiCookingPotFill, "IconToolsKitchen2");
export const IconTrash = make(PiTrashDuotone, PiTrashFill, "IconTrash");
export const IconTrendingDown = make(PiTrendDownDuotone, PiTrendDownFill, "IconTrendingDown");
export const IconTrendingUp = make(PiTrendUpDuotone, PiTrendUpFill, "IconTrendingUp");
export const IconTruck = make(PiTruckDuotone, PiTruckFill, "IconTruck");
export const IconUpload = make(PiUploadSimpleDuotone, PiUploadSimpleFill, "IconUpload");
export const IconUser = make(PiUserDuotone, PiUserFill, "IconUser");
export const IconUsers = make(PiUsersDuotone, PiUsersFill, "IconUsers");
export const IconUxCircle = make(PiUserCircleDuotone, PiUserCircleFill, "IconUxCircle");
export const IconWallet = make(PiWalletDuotone, PiWalletFill, "IconWallet");
export const IconWorld = make(PiGlobeHemisphereEastDuotone, PiGlobeHemisphereEastFill, "IconWorld");
export const IconX = make(PiXBold, PiXFill, "IconX");
export const Instagram = make(PiInstagramLogoDuotone, PiInstagramLogoFill, "Instagram");
export const IoCalendarClearOutline = make(PiCalendarBlankDuotone, PiCalendarBlankFill, "IoCalendarClearOutline");
export const IoCheckmarkDone = make(PiChecksBold, PiChecksFill, "IoCheckmarkDone");
export const IoIosMore = make(PiDotsThreeBold, PiDotsThreeFill, "IoIosMore");
export const IoMdSend = make(PiPaperPlaneRightDuotone, PiPaperPlaneRightFill, "IoMdSend");
export const IoPersonOutline = make(PiUserDuotone, PiUserFill, "IoPersonOutline");
export const KeyRound = make(PiKeyDuotone, PiKeyFill, "KeyRound");
export const Layers = make(PiStackDuotone, PiStackFill, "Layers");
export const LayoutDashboard = make(PiSquaresFourDuotone, PiSquaresFourFill, "LayoutDashboard");
export const Linkedin = make(PiLinkedinLogoDuotone, PiLinkedinLogoFill, "Linkedin");
export const Loader = make(PiCircleNotchBold, PiCircleNotchFill, "Loader");
export const Loader2 = make(PiCircleNotchBold, PiCircleNotchFill, "Loader2");
export const Lock = make(PiLockKeyDuotone, PiLockKeyFill, "Lock");
export const LogIn = make(PiSignInDuotone, PiSignInFill, "LogIn");
export const LogOut = make(PiSignOutDuotone, PiSignOutFill, "LogOut");
export const LuClock2 = make(PiClockDuotone, PiClockFill, "LuClock2");
export const LuPhone = make(PiPhoneDuotone, PiPhoneFill, "LuPhone");
export const LuUserRoundSearch = make(PiUserFocusDuotone, PiUserFocusFill, "LuUserRoundSearch");
export const Mail = make(PiEnvelopeSimpleDuotone, PiEnvelopeSimpleFill, "Mail");
export const MailCheck = make(PiEnvelopeOpenDuotone, PiEnvelopeOpenFill, "MailCheck");
export const MapPin = make(PiMapPinDuotone, PiMapPinFill, "MapPin");
export const Megaphone = make(PiMegaphoneDuotone, PiMegaphoneFill, "Megaphone");
export const Menu = make(PiListBold, PiListFill, "Menu");
export const MessageCircle = make(PiChatCircleDotsDuotone, PiChatCircleDotsFill, "MessageCircle");
export const MessageSquare = make(PiChatCenteredTextDuotone, PiChatCenteredTextFill, "MessageSquare");
export const MonitorX = make(PiMonitorDuotone, PiMonitorFill, "MonitorX");
export const MoreHorizontal = make(PiDotsThreeBold, PiDotsThreeFill, "MoreHorizontal");
export const Motorbike = make(PiMopedDuotone, PiMopedFill, "Motorbike");
export const Package = make(PiPackageDuotone, PiPackageFill, "Package");
export const PackageCheck = make(PiSealCheckDuotone, PiSealCheckFill, "PackageCheck");
export const PanelLeftIcon = make(PiSidebarSimpleDuotone, PiSidebarSimpleFill, "PanelLeftIcon");
export const Phone = make(PiPhoneDuotone, PiPhoneFill, "Phone");
export const Plus = make(PiPlusBold, PiPlusFill, "Plus");
export const Power = make(PiPowerDuotone, PiPowerFill, "Power");
export const ReceiptText = make(PiReceiptDuotone, PiReceiptFill, "ReceiptText");
export const RefreshCw = make(PiArrowsClockwiseDuotone, PiArrowsClockwiseFill, "RefreshCw");
export const Scale = make(PiScalesDuotone, PiScalesFill, "Scale");
export const ScrollText = make(PiScrollDuotone, PiScrollFill, "ScrollText");
export const Search = make(PiMagnifyingGlassDuotone, PiMagnifyingGlassFill, "Search");
export const ServerCrash = make(PiHardDrivesDuotone, PiHardDrivesFill, "ServerCrash");
export const Settings = make(PiGearSixDuotone, PiGearSixFill, "Settings");
export const Shield = make(PiShieldCheckDuotone, PiShieldCheckFill, "Shield");
export const ShieldAlert = make(PiShieldWarningDuotone, PiShieldWarningFill, "ShieldAlert");
export const ShieldCheck = make(PiShieldCheckDuotone, PiShieldCheckFill, "ShieldCheck");
export const ShoppingBag = make(PiShoppingBagOpenDuotone, PiShoppingBagOpenFill, "ShoppingBag");
export const ShoppingCart = make(PiShoppingCartSimpleDuotone, PiShoppingCartSimpleFill, "ShoppingCart");
export const Signature = make(PiSignatureDuotone, PiSignatureFill, "Signature");
export const Star = make(PiStarDuotone, PiStarFill, "Star");
export const Store = make(PiStorefrontDuotone, PiStorefrontFill, "Store");
export const TbCancel = make(PiProhibitDuotone, PiProhibitFill, "TbCancel");
export const TbMessageDots = make(PiChatCircleDotsDuotone, PiChatCircleDotsFill, "TbMessageDots");
export const TbMessagePlus = make(PiChatCenteredTextDuotone, PiChatCenteredTextFill, "TbMessagePlus");
export const TestTube2 = make(PiFlaskDuotone, PiFlaskFill, "TestTube2");
export const ThumbsUp = make(PiThumbsUpDuotone, PiThumbsUpFill, "ThumbsUp");
export const Trash2 = make(PiTrashDuotone, PiTrashFill, "Trash2");
export const TrendingUp = make(PiTrendUpDuotone, PiTrendUpFill, "TrendingUp");
export const TriangleAlert = make(PiWarningDuotone, PiWarningFill, "TriangleAlert");
export const Truck = make(PiTruckDuotone, PiTruckFill, "Truck");
export const Twitter = make(PiXLogoDuotone, PiXLogoFill, "Twitter");
export const Upload = make(PiUploadSimpleDuotone, PiUploadSimpleFill, "Upload");
export const User = make(PiUserDuotone, PiUserFill, "User");
export const UserLock = make(PiUserFocusDuotone, PiUserFocusFill, "UserLock");
export const UserPlus = make(PiUserPlusDuotone, PiUserPlusFill, "UserPlus");
export const UserRound = make(PiUserCircleDuotone, PiUserCircleFill, "UserRound");
export const Users = make(PiUsersDuotone, PiUsersFill, "Users");
export const UsersRound = make(PiUsersThreeDuotone, PiUsersThreeFill, "UsersRound");
export const Wallet = make(PiWalletDuotone, PiWalletFill, "Wallet");
export const X = make(PiXBold, PiXFill, "X");
export const XCircle = make(PiXCircleDuotone, PiXCircleFill, "XCircle");
export const XIcon = make(PiXBold, PiXFill, "XIcon");
export const Zap = make(PiLightningDuotone, PiLightningFill, "Zap");
