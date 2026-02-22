import type { Request, Response } from 'express';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const buildAutocompleteUrl = (input: string, country?: string, language?: string) => {
  const params = new URLSearchParams({
    input,
    key: GOOGLE_MAPS_API_KEY ?? '',
    types: 'geocode'
  });

  if (country) {
    params.set('components', `country:${country}`);
  }

  if (language) {
    params.set('language', language);
  }

  return `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`;
};

export const autocompletePlaces = async (req: Request, res: Response) => {
  const input = String(req.query.input ?? '').trim();
  const country = typeof req.query.country === 'string' ? req.query.country : undefined;
  const language = typeof req.query.language === 'string' ? req.query.language : undefined;

  if (!input) {
    return res.status(400).json({
      success: false,
      message: 'Query param "input" is required.'
    });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      success: false,
      message: 'Google Maps API key is not configured.'
    });
  }

  try {
    const url = buildAutocompleteUrl(input, country, language);
    const response = await fetch(url);
    const data: any = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return res.status(502).json({
        success: false,
        message: data.error_message || 'Google Places API error.',
        status: data.status
      });
    }

    const predictions = (data.predictions || []).map((prediction: any) => ({
      description: prediction.description,
      placeId: prediction.place_id,
      mainText: prediction.structured_formatting?.main_text,
      secondaryText: prediction.structured_formatting?.secondary_text
    }));

    return res.status(200).json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Google Places autocomplete error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch Google Places suggestions.'
    });
  }
};
