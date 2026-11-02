-- Update the location section in the HTML template
-- Fix the Google Maps link syntax and coordinates display

UPDATE referencevalue 
SET description = REPLACE(description, 
'@if (!string.IsNullOrEmpty(locationDetail?.googlelocation))
{
    <div class="mt-4">
        <a href="@locationDetail.googlelocation" target="_blank" class="btn btn-light btn-sm w-100">
            <i class="fas fa-external-link-alt me-1"></i>View on Google Maps
        </a>
    </div>
}

<!-- Coordinates -->
@if (locationDetail?.latitude != 0 && locationDetail?.longitude != 0)
{
    <div class="mt-3 text-center">
        <span class="location-badge">
            <i class="fas fa-crosshairs me-1"></i>
            Lat: @locationDetail.latitude.ToString("F6")
        </span>
        <span class="location-badge">
            <i class="fas fa-crosshairs me-1"></i>
            Lng: @locationDetail.longitude.ToString("F6")
        </span>
    </div>
}',

'@if (!string.IsNullOrEmpty(locationDetail?.googlelocation))
{
    <div class="mt-4">
        <a href="@locationDetail.googlelocation" target="_blank" class="btn btn-light btn-sm w-100">
            <i class="fas fa-external-link-alt me-1"></i>View on Google Maps
        </a>
    </div>
}

<!-- Coordinates -->
@if (locationDetail?.latitude != 0 && locationDetail?.longitude != 0)
{
    <div class="mt-3 text-center">
        <span class="location-badge">
            <i class="fas fa-crosshairs me-1"></i>
            Lat: @locationDetail.latitude.ToString("F6")
        </span>
        <span class="location-badge">
            <i class="fas fa-crosshairs me-1"></i>
            Lng: @locationDetail.longitude.ToString("F6")
        </span>
    </div>
}')

WHERE id = 61;
